function BranchCard({ branch, selected = false, onSelect }) {
  return (
    <button
      type="button"
      className={selected ? 'branch-card is-selected' : 'branch-card'}
      onClick={() => onSelect?.(branch)}
    >
      <h3>{branch.name}</h3>
      <p>{branch.address}</p>
      {branch.distance != null && <p>{branch.distance} km away</p>}
    </button>
  );
}

export default BranchCard;
