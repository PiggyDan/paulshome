import Image from "next/image";

const projects = [
  { src: "/projects/porch-angle.jpg", alt: "Custom timber cabin with covered porch" },
  { src: "/projects/interior.jpg", alt: "Finished timber interior with wood panel walls" },
  { src: "/projects/porch-front.jpg", alt: "Front porch and entrance finishing work" },
  { src: "/projects/cabin-side.jpg", alt: "Exterior timber cabin finishing" },
  { src: "/projects/cabin-rear.jpg", alt: "Rear timber cladding and roof work" },
  { src: "/projects/cabin-wide.jpg", alt: "Completed compact timber cabin" },
];

const services = [
  ["Home Repairs", "Practical repairs for everyday household problems, done carefully and built to last."],
  ["Renovation", "Interior and exterior improvement work that makes your home more comfortable and useful."],
  ["Woodwork", "Custom timber finishes, wall cladding, cabins, porches and other made-to-fit projects."],
  ["Maintenance", "Reliable maintenance and small improvement jobs for homes, cabins and properties."],
];

export default function Home() {
  return (
    <main>
      <header className="nav-wrap">
        <nav className="nav shell" aria-label="Main navigation">
          <a className="brand" href="#home" aria-label="Paul's Home Repair home">
            <span className="brand-mark">P</span>
            <span>Paul&apos;s Home Repair</span>
          </a>
          <div className="nav-links">
            <a href="#about">About</a>
            <a href="#services">Services</a>
            <a href="#work">Our Work</a>
            <a href="#contact" className="nav-cta">Contact</a>
          </div>
        </nav>
      </header>

      <section id="home" className="hero">
        <Image
          src="/projects/porch-angle.jpg"
          alt="Paul's Home Repair timber cabin project"
          fill
          priority
          sizes="100vw"
          className="hero-image"
        />
        <div className="hero-overlay" />
        <div className="shell hero-content">
          <p className="eyebrow">Serving Ulaanbaatar since 2014</p>
          <h1>Built with care.<br />Repaired to last.</h1>
          <p className="hero-copy">
            Dependable home repair, renovation and custom woodwork for people who value solid craftsmanship and straightforward service.
          </p>
          <div className="hero-actions">
            <a className="button button-primary" href="tel:+97689211195">Call +976 89211195</a>
            <a className="button button-secondary" href="#work">See our work</a>
          </div>
        </div>
      </section>

      <section id="about" className="section shell about-grid">
        <div>
          <p className="section-kicker">About Paul</p>
          <h2>Good work should feel solid long after the job is finished.</h2>
        </div>
        <div className="about-copy">
          <p>
            Since 2014, Paul has helped homeowners with repairs, improvements and custom building work across Ulaanbaatar. His approach is simple: understand the job, use practical solutions, pay attention to the details, and leave the customer with work he can stand behind.
          </p>
          <p>
            From small household fixes to timber interiors, exterior finishing and cabin projects, every job is treated with the same goal — clean workmanship, honest communication and lasting results.
          </p>
          <div className="stats">
            <div><strong>12+</strong><span>Years of experience</span></div>
            <div><strong>2014</strong><span>Established</span></div>
            <div><strong>UB</strong><span>Local service</span></div>
          </div>
        </div>
      </section>

      <section id="services" className="section section-tint">
        <div className="shell">
          <p className="section-kicker">What we do</p>
          <div className="section-heading-row">
            <h2>Reliable help for your home.</h2>
            <p>For repair, renovation and custom improvement work, get in touch and tell us what you need.</p>
          </div>
          <div className="service-grid">
            {services.map(([title, text], i) => (
              <article className="service-card" key={title}>
                <span className="service-number">0{i + 1}</span>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="work" className="section shell">
        <p className="section-kicker">Recent work</p>
        <div className="section-heading-row">
          <h2>Craftsmanship you can see.</h2>
          <p>A selection of Paul&apos;s completed building and finishing work.</p>
        </div>
        <div className="gallery">
          {projects.map((project, i) => (
            <figure className={`gallery-item gallery-item-${i + 1}`} key={project.src}>
              <Image src={project.src} alt={project.alt} fill sizes="(max-width: 800px) 100vw, 50vw" />
            </figure>
          ))}
        </div>
      </section>

      <section id="contact" className="contact-section">
        <div className="shell contact-grid">
          <div>
            <p className="section-kicker light">Contact</p>
            <h2>Have a repair or project in mind?</h2>
            <p className="contact-intro">Call or email Paul and describe the work you need. Photos and measurements are helpful for an initial discussion.</p>
          </div>
          <div className="contact-card">
            <a href="tel:+97689211195"><span>Phone</span><strong>+976 89211195</strong></a>
            <a href="mailto:paul22@gmail.com"><span>Email</span><strong>paul22@gmail.com</strong></a>
            <div><span>Address</span><strong>Gachuurt, Ulaanbaatar, Mongolia</strong></div>
          </div>
        </div>
      </section>

      <footer>
        <div className="shell footer-content">
          <p>© {new Date().getFullYear()} Paul&apos;s Home Repair. All rights reserved.</p>
          <p>Repair • Renovation • Woodwork • Maintenance</p>
        </div>
      </footer>
    </main>
  );
}
