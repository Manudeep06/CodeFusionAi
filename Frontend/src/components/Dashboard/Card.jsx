export function Card({ children, className = "", noPad = false }) {
  return <section className={`cf-surface ${noPad ? "" : ""} ${className}`}>{children}</section>;
}

export default Card;
