type SectionHeadingProps = {
  eyebrow: string;
  title: string;
  description?: string;
  centered?: boolean;
  id?: string;
};

export function SectionHeading({
  eyebrow,
  title,
  description,
  centered = false,
  id,
}: SectionHeadingProps) {
  return (
    <div className={`section-heading${centered ? " section-heading--center" : ""}`}>
      <p className="eyebrow">{eyebrow}</p>
      <h2 id={id}>{title}</h2>
      {description && <p className="section-heading__description">{description}</p>}
    </div>
  );
}
