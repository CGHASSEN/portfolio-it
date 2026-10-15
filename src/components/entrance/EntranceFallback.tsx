type EntranceFallbackProps = {
  unlocked: boolean;
};

export function EntranceFallback({ unlocked }: EntranceFallbackProps) {
  return (
    <div aria-hidden="true" className={`fallback-scene${unlocked ? " fallback-scene--unlocked" : ""}`}>
      <div className="fallback-scene__ceiling">
        <span />
        <span />
      </div>
      <div className="fallback-scene__wall">
        <div className="fallback-scene__sign">SECURE FACILITY</div>
        <div className="fallback-scene__door">
          <div className="fallback-scene__door-face">
            <span className="fallback-scene__door-label">DC / 01</span>
            <span className="fallback-scene__door-handle" />
            <span className="fallback-scene__door-lights"><i /><i /><i /></span>
          </div>
        </div>
        <div className="fallback-scene__access"><i /><i /><i /></div>
      </div>
      <div className="fallback-scene__floor" />
      <div className="fallback-scene__vignette" />
    </div>
  );
}
