function FolderIcon({ open = false, size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className="shrink-0">
      {open ? (
        <>
          <path d="M1 5h4.5l1.5 2H15v7H1V5z" fill="#e3b34120" stroke="#e3b341" strokeWidth="0.9" />
          <path d="M1 7h14" stroke="#e3b341" strokeWidth="0.7" opacity="0.5" />
        </>
      ) : (
        <path d="M1 5h4.5l1 2H15v7H1V5z" fill="#e3b34118" stroke="#e3b341" strokeWidth="0.9" />
      )}
    </svg>
  );
}

export default FolderIcon;
