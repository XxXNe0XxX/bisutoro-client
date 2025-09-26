import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getDrinksMenu,
  createDrinksSection,
  updateDrinksSection,
  deleteDrinksSection,
  reorderDrinksSections,
  createDrinksGroup,
  updateDrinksGroup,
  deleteDrinksGroup,
  reorderDrinksGroups,
  createDrinksItem,
  updateDrinksItem,
  deleteDrinksItem,
} from "../../lib/api";
import { useMemo, useState } from "react";
import Modal from "../../components/ui/Modal";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import { FaArrowDown, FaArrowUp, FaP, FaPlus } from "react-icons/fa6";

export default function DashboardDrinks() {
  const qc = useQueryClient();
  const drinksQ = useQuery({ queryKey: ["drinks"], queryFn: getDrinksMenu });
  const sections = useMemo(
    () => (Array.isArray(drinksQ.data) ? drinksQ.data : []),
    [drinksQ.data]
  );

  const [state, setState] = useState({
    sectionModal: null, // { mode: 'create'|'edit', data? }
    groupModal: null, // { mode, section, data? }
    itemModal: null, // { mode, group, data? }
    confirm: null, // { type: 'section'|'group'|'item', id, name }
  });

  function refresh() {
    qc.invalidateQueries({ queryKey: ["drinks"] });
  }

  // Mutations - Sections
  const createSecMut = useMutation({
    mutationFn: createDrinksSection,
    onSuccess: refresh,
  });
  const updateSecMut = useMutation({
    mutationFn: ({ id, patch }) => updateDrinksSection(id, patch),
    onSuccess: refresh,
  });
  const deleteSecMut = useMutation({
    mutationFn: deleteDrinksSection,
    onSuccess: refresh,
  });
  const reorderSecsMut = useMutation({
    mutationFn: reorderDrinksSections,
    onSuccess: refresh,
  });

  // Mutations - Groups
  const createGrpMut = useMutation({
    mutationFn: createDrinksGroup,
    onSuccess: refresh,
  });
  const updateGrpMut = useMutation({
    mutationFn: ({ id, patch }) => updateDrinksGroup(id, patch),
    onSuccess: refresh,
  });
  const deleteGrpMut = useMutation({
    mutationFn: deleteDrinksGroup,
    onSuccess: refresh,
  });
  const reorderGrpsMut = useMutation({
    mutationFn: ({ sectionId, order }) => reorderDrinksGroups(sectionId, order),
    onSuccess: refresh,
  });

  // Mutations - Items
  const createItemMut = useMutation({
    mutationFn: createDrinksItem,
    onSuccess: refresh,
  });
  const updateItemMut = useMutation({
    mutationFn: ({ id, patch }) => updateDrinksItem(id, patch),
    onSuccess: refresh,
  });
  const deleteItemMut = useMutation({
    mutationFn: deleteDrinksItem,
    onSuccess: refresh,
  });

  // Helpers
  function moveSection(secId, dir) {
    const ids = sections.map((s) => s.id);
    const idx = ids.indexOf(secId);
    const swap = dir === "up" ? idx - 1 : idx + 1;
    if (swap < 0 || swap >= ids.length) return;
    [ids[idx], ids[swap]] = [ids[swap], ids[idx]];
    reorderSecsMut.mutate(ids);
  }

  function moveGroup(sectionId, groupId, dir) {
    const sec = sections.find((s) => s.id === sectionId);
    if (!sec) return;
    const ids = (sec.groups || []).map((g) => g.id);
    const idx = ids.indexOf(groupId);
    const swap = dir === "up" ? idx - 1 : idx + 1;
    if (swap < 0 || swap >= ids.length) return;
    [ids[idx], ids[swap]] = [ids[swap], ids[idx]];
    reorderGrpsMut.mutate({ sectionId, order: ids });
  }

  function SectionForm({ mode, data, onClose }) {
    const [name, setName] = useState(data?.name || "");
    const [slug, setSlug] = useState(data?.slug || "");
    function submit(e) {
      e.preventDefault();
      if (!name.trim()) return;
      if (mode === "create")
        createSecMut.mutate({
          name: name.trim(),
          slug: slug.trim() || undefined,
        });
      else
        updateSecMut.mutate({
          id: data.id,
          patch: {
            name: name.trim(),
            ...(slug.trim() ? { slug: slug.trim() } : {}),
          },
        });
      onClose();
    }
    return (
      <form onSubmit={submit} className="space-y-3">
        <div>
          <label className="text-sm text-muted">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-2xl p-2 border border-secondary/40 bg-background"
          />
        </div>
        <div>
          <label className="text-sm text-muted">Slug (optional)</label>
          <input
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            className="w-full rounded-2xl p-2 border border-secondary/40 bg-background"
          />
        </div>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 rounded bg-secondary text-contrast"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-3 py-1 rounded bg-primary text-contrast"
          >
            {mode === "create" ? "Create" : "Save"}
          </button>
        </div>
      </form>
    );
  }

  function GroupForm({ mode, section, data, onClose }) {
    const [name, setName] = useState(data?.name || "");
    function submit(e) {
      e.preventDefault();
      if (!name.trim()) return;
      if (mode === "create")
        createGrpMut.mutate({ section_id: section.id, name: name.trim() });
      else updateGrpMut.mutate({ id: data.id, patch: { name: name.trim() } });
      onClose();
    }
    return (
      <form onSubmit={submit} className="space-y-3">
        <div>
          <label className="text-sm text-muted">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-2xl p-2 border border-secondary/40 bg-background"
          />
        </div>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 rounded bg-secondary text-contrast"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-3 py-1 rounded bg-primary text-contrast"
          >
            {mode === "create" ? "Create" : "Save"}
          </button>
        </div>
      </form>
    );
  }

  function ItemForm({ mode, group, data, onClose }) {
    const [name, setName] = useState(data?.name || "");
    const [origin, setOrigin] = useState(data?.origin || "");
    const [ingredientInput, setIngredientInput] = useState("");
    const [ingredients, setIngredients] = useState(
      Array.isArray(data?.ingredients) ? data.ingredients : []
    );
    const [amounts, setAmounts] = useState(
      Array.isArray(data?.amounts) && data.amounts.length
        ? data.amounts
        : [{ size: "", price: 0 }]
    );

    function addIngredient() {
      const v = ingredientInput.trim();
      if (!v) return;
      if (ingredients.some((x) => x.toLowerCase() === v.toLowerCase())) {
        setIngredientInput("");
        return;
      }
      setIngredients((arr) => [...arr, v]);
      setIngredientInput("");
    }
    function removeIngredient(idx) {
      setIngredients((arr) => arr.filter((_, i) => i !== idx));
    }
    function addAmount() {
      setAmounts((arr) => [...arr, { size: "", price: 0 }]);
    }
    function removeAmount(idx) {
      setAmounts((arr) => arr.filter((_, i) => i !== idx));
    }
    function updateAmount(idx, patch) {
      setAmounts((arr) =>
        arr.map((a, i) => (i === idx ? { ...a, ...patch } : a))
      );
    }

    function submit(e) {
      e.preventDefault();
      if (!name.trim() || !amounts.length) return;
      const payload = {
        group_id: group.id,
        name: name.trim(),
        origin: origin.trim() || undefined,
        ingredients,
        amounts: amounts
          .map((a) => ({
            size: String(a.size || "").trim(),
            price: Number(a.price) || 0,
          }))
          .filter((a) => a.size),
      };
      if (mode === "create") createItemMut.mutate(payload);
      else
        updateItemMut.mutate({
          id: data.id,
          patch: { ...payload, group_id: undefined },
        });
      onClose();
    }

    return (
      <form onSubmit={submit} className="space-y-3">
        <div>
          <label className="text-sm text-muted">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-2xl p-2 border border-secondary/40 bg-background"
          />
        </div>
        <div>
          <label className="text-sm text-muted">Origin (optional)</label>
          <input
            value={origin}
            onChange={(e) => setOrigin(e.target.value)}
            className="w-full rounded-2xl p-2 border border-secondary/40 bg-background"
          />
        </div>
        <div>
          <label className="text-sm text-muted">Ingredients</label>
          <div className="flex gap-2">
            <input
              value={ingredientInput}
              onChange={(e) => setIngredientInput(e.target.value)}
              className="flex-1 rounded-2xl p-2 border border-secondary/40 bg-background"
            />
            <button
              type="button"
              onClick={addIngredient}
              className="px-3 py-2 rounded bg-secondary text-contrast"
            >
              Add
            </button>
          </div>
          <ul className="mt-2 flex flex-wrap gap-2">
            {ingredients.map((ing, idx) => (
              <li
                key={idx}
                className="px-2 py-1 rounded-full border border-secondary/40 text-sm flex items-center gap-2"
              >
                <span>{ing}</span>
                <button
                  type="button"
                  onClick={() => removeIngredient(idx)}
                  className="text-danger"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <label className="text-sm text-muted">Amounts</label>
          <div className="space-y-2">
            {amounts.map((a, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  placeholder="Size"
                  value={a.size}
                  onChange={(e) => updateAmount(idx, { size: e.target.value })}
                  className="w-40 rounded-2xl p-2 border border-secondary/40 bg-background"
                />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={a.price}
                  onChange={(e) => updateAmount(idx, { price: e.target.value })}
                  className="w-32 rounded-2xl p-2 border border-secondary/40 bg-background"
                />
                <button
                  type="button"
                  onClick={() => removeAmount(idx)}
                  className="px-2 py-1 rounded bg-danger text-contrast"
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addAmount}
              className="px-3 py-1 rounded bg-secondary text-contrast"
            >
              Add amount
            </button>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 rounded bg-secondary text-contrast"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-3 py-1 rounded bg-primary text-contrast"
          >
            {mode === "create" ? "Create" : "Save"}
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="space-y-6 p-3 text-base-fg">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Drinks</h1>
        <button
          className="px-3 py-1 rounded bg-primary text-contrast"
          onClick={() =>
            setState((s) => ({ ...s, sectionModal: { mode: "create" } }))
          }
        >
          New section
        </button>
      </div>
      {drinksQ.isLoading && <div className="text-muted">Loading…</div>}
      {drinksQ.isError && (
        <div className="text-danger text-sm">
          {drinksQ.error?.message || "Failed to load drinks"}
        </div>
      )}

      {!drinksQ.isLoading && !drinksQ.isError && (
        <div className="space-y-6">
          {sections.map((sec) => (
            <section
              key={sec.id}
              className="rounded-2xl border border-secondary/40 p-3"
            >
              <header className="flex items-center justify-between gap-2">
                <div className="font-semibold text-base-fg">{sec.name}</div>
                <div className="flex items-center gap-3">
                  <button
                    className="text-base-fg"
                    onClick={() => moveSection(sec.id, "up")}
                  >
                    <FaArrowUp />
                  </button>
                  <button
                    className=" text-base-fg"
                    onClick={() => moveSection(sec.id, "down")}
                  >
                    <FaArrowDown />
                  </button>
                  <button
                    className="px-2 py-1 rounded bg-secondary text-contrast"
                    onClick={() =>
                      setState((s) => ({
                        ...s,
                        sectionModal: { mode: "edit", data: sec },
                      }))
                    }
                  >
                    Edit
                  </button>
                  <button
                    className="px-2 py-1 rounded bg-danger text-contrast"
                    onClick={() =>
                      setState((s) => ({
                        ...s,
                        confirm: {
                          type: "section",
                          id: sec.id,
                          name: sec.name,
                        },
                      }))
                    }
                  >
                    Delete
                  </button>
                  <button
                    className="px-2 py-1 rounded bg-primary text-contrast"
                    onClick={() =>
                      setState((s) => ({
                        ...s,
                        groupModal: { mode: "create", section: sec },
                      }))
                    }
                  >
                    New group
                  </button>
                </div>
              </header>
              <div className="mt-2 space-y-3">
                {(sec.groups || []).map((g) => (
                  <div
                    key={g.id}
                    className="rounded-xl border border-secondary/30 p-2"
                  >
                    <div className="flex items-center justify-between gap-2 bg-primary px-3 py-1 rounded-md">
                      <div className="font-medium flex items-center text-contrast gap-5">
                        {g.name}

                        <button
                          className="text-contrast"
                          onClick={() => moveGroup(sec.id, g.id, "up")}
                        >
                          <FaArrowUp />
                        </button>
                        <button
                          className="text-contrast"
                          onClick={() => moveGroup(sec.id, g.id, "down")}
                        >
                          <FaArrowDown />
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          className="px-2 py-1 rounded bg-secondary text-contrast"
                          onClick={() =>
                            setState((s) => ({
                              ...s,
                              groupModal: {
                                mode: "edit",
                                section: sec,
                                data: g,
                              },
                            }))
                          }
                        >
                          Edit
                        </button>
                        <button
                          className="px-2 py-1 rounded bg-danger text-contrast"
                          onClick={() =>
                            setState((s) => ({
                              ...s,
                              confirm: {
                                type: "group",
                                id: g.id,
                                name: g.name,
                              },
                            }))
                          }
                        >
                          Delete
                        </button>
                        <button
                          className="px-2 py-1 rounded underline text-contrast"
                          onClick={() =>
                            setState((s) => ({
                              ...s,
                              itemModal: { mode: "create", group: g },
                            }))
                          }
                        >
                          <p className="flex items-center gap-2">
                            Add item
                            <FaPlus />
                          </p>
                        </button>
                      </div>
                    </div>
                    <ul className="mt-2 space-y-1 *:px-1 divide-y *:pb-1 divide-secondary  grid-cols-3 grid">
                      {(g.items || []).map((it) => (
                        <li
                          key={it.id}
                          className="flex items-center justify-between text-sm col-span-3"
                        >
                          <span className="font-medium">{it.name}</span>
                          <div className="flex items-center gap-2 ml-3">
                            <span className="text-muted text-right">
                              {(it.amounts || [])
                                .map(
                                  (a) =>
                                    `${a.size} $${Number(a.price).toFixed(2)}`
                                )
                                .join("  •  ")}
                            </span>
                            <button
                              className="px-2 py-1 rounded bg-secondary text-contrast"
                              onClick={() =>
                                setState((s) => ({
                                  ...s,
                                  itemModal: {
                                    mode: "edit",
                                    group: g,
                                    data: it,
                                  },
                                }))
                              }
                            >
                              Edit
                            </button>
                            <button
                              className="px-2 py-1 rounded bg-danger text-contrast"
                              onClick={() =>
                                setState((s) => ({
                                  ...s,
                                  confirm: {
                                    type: "item",
                                    id: it.id,
                                    name: it.name,
                                  },
                                }))
                              }
                            >
                              Delete
                            </button>
                          </div>
                        </li>
                      ))}
                      {(g.items || []).length === 0 && (
                        <li className="text-muted">No items in this group.</li>
                      )}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
          ))}
          {sections.length === 0 && (
            <div className="text-muted">No sections yet.</div>
          )}
        </div>
      )}

      {/* Modals */}
      <Modal
        open={!!state.sectionModal}
        onClose={() => setState((s) => ({ ...s, sectionModal: null }))}
        title={
          state.sectionModal?.mode === "create" ? "New section" : "Edit section"
        }
      >
        {state.sectionModal && (
          <SectionForm
            mode={state.sectionModal.mode}
            data={state.sectionModal.data}
            onClose={() => setState((s) => ({ ...s, sectionModal: null }))}
          />
        )}
      </Modal>

      <Modal
        open={!!state.groupModal}
        onClose={() => setState((s) => ({ ...s, groupModal: null }))}
        title={state.groupModal?.mode === "create" ? "New group" : "Edit group"}
      >
        {state.groupModal && (
          <GroupForm
            mode={state.groupModal.mode}
            section={state.groupModal.section}
            data={state.groupModal.data}
            onClose={() => setState((s) => ({ ...s, groupModal: null }))}
          />
        )}
      </Modal>

      <Modal
        open={!!state.itemModal}
        onClose={() => setState((s) => ({ ...s, itemModal: null }))}
        title={state.itemModal?.mode === "create" ? "New item" : "Edit item"}
      >
        {state.itemModal && (
          <ItemForm
            mode={state.itemModal.mode}
            group={state.itemModal.group}
            data={state.itemModal.data}
            onClose={() => setState((s) => ({ ...s, itemModal: null }))}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={!!state.confirm}
        danger
        title="Confirm delete"
        message={`Delete ${state.confirm?.type} "${state.confirm?.name}"? This cannot be undone.`}
        onCancel={() => setState((s) => ({ ...s, confirm: null }))}
        onConfirm={() => {
          const c = state.confirm;
          if (!c) return;
          if (c.type === "section") deleteSecMut.mutate(c.id);
          if (c.type === "group") deleteGrpMut.mutate(c.id);
          if (c.type === "item") deleteItemMut.mutate(c.id);
          setState((s) => ({ ...s, confirm: null }));
        }}
      />
    </div>
  );
}
