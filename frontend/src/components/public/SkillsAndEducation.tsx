import { CERTIFICATIONS, EDUCATION, SKILL_GROUPS } from '../../content/profile'

/** Static skills and education sections for the Experience page (no API data, so always in the prerendered HTML). */
export default function SkillsAndEducation() {
  return (
    <>
      <section aria-labelledby="education-title" className="mt-24 max-w-3xl">
        <h2 id="education-title" className="display display-lg">
          Education & certifications
        </h2>
        <ul className="mt-8 space-y-6">
          {[...EDUCATION, ...CERTIFICATIONS].map((entry) => (
            <li key={entry.institution}>
              <p className="text-xl font-bold text-ink">{entry.institution}</p>
              <p className="mt-1">{entry.detail}</p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="skills-title" className="mt-24 max-w-3xl">
        <h2 id="skills-title" className="display display-lg">
          Skills
        </h2>
        <div className="mt-8 space-y-8">
          {SKILL_GROUPS.map((group) => (
            <div key={group.label}>
              <h3 className="text-base font-bold text-ink">{group.label}</h3>
              <ul className="mt-3 flex flex-wrap gap-2 text-base">
                {group.skills.map((skill) => (
                  <li key={skill} className="rounded-full bg-card px-4 py-1.5">
                    {skill}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}
