function StatBadge({ value, label, color }) {
  return (
    <div className="text-center">
      <div className="text-2xl font-black" style={{ color }}>{value}</div>
      <div className="text-[10px] font-bold text-slate-600 uppercase tracking-wider mt-0.5">{label}</div>
    </div>
  );
}

export default StatBadge;
