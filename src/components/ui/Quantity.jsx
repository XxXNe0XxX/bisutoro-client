const Quantity = ({ children }) => {
  return (
    <span className="text-[10px] px-1.5 py-0.5 rounded-2xl bg-secondary/30 text-base-fg whitespace-nowrap">
      {children}
    </span>
  );
};

export default Quantity;
