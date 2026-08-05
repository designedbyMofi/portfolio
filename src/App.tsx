import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type MouseEvent as ReactMouseEvent, type PointerEvent as ReactPointerEvent, type FocusEvent as ReactFocusEvent } from 'react';
import { flushSync } from 'react-dom';
import { getCalApi } from '@calcom/embed-react';

type ProjectKind = 'mobile' | 'web';
type ProjectMotion = 'video' | 'carousel' | 'static';
type PortfolioView = 'shots' | 'projects' | 'resume';
type ShotFilter = 'all' | 'mobile' | 'web' | 'dashboards' | 'others';

type Project = {
  image: string;
  alt: string;
  kind: ProjectKind;
  motion: ProjectMotion;
};

type PreviewOrigin = { left: number; top: number; width: number; height: number; radius: number };
type ViewTransitionDocument = Document & { startViewTransition?: (update: () => void) => { finished: Promise<void> } };
type UiSound = 'click' | 'navigation' | 'open' | 'close' | 'select' | 'confirm' | 'toggle';

const viewFromPath = (): PortfolioView => {
  if (window.location.pathname === '/resume') return 'resume';
  if (window.location.pathname.startsWith('/projects')) return 'projects';
  return 'shots';
};

const isVurtCaseStudyPath = () => window.location.pathname === '/projects/vurt';

let uiAudioContext: AudioContext | null = null;
let uiSoundMuted = false;

const setUiSoundMuted = (muted: boolean) => { uiSoundMuted = muted; };

const playUiSound = async (sound: UiSound) => {
  if (uiSoundMuted) return;

  const AudioContextConstructor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextConstructor) return;

  uiAudioContext ??= new AudioContextConstructor();
  const context = uiAudioContext;
  if (context.state === 'suspended') await context.resume().catch(() => undefined);
  if (context.state !== 'running') return;

  const now = context.currentTime;
  const tone = (startFrequency: number, endFrequency: number, duration: number, volume: number, delay = 0) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const start = now + delay;
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(startFrequency, start);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(40, endFrequency), start + duration);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.01);
  };

  switch (sound) {
    case 'navigation': tone(420, 570, 0.075, 0.026); break;
    case 'open': tone(175, 265, 0.115, 0.034); break;
    case 'close': tone(285, 170, 0.09, 0.028); break;
    case 'select': tone(560, 690, 0.052, 0.022); break;
    case 'confirm':
      tone(500, 580, 0.07, 0.022);
      tone(670, 760, 0.075, 0.018, 0.045);
      break;
    case 'toggle': tone(330, 470, 0.08, 0.026); break;
    default: tone(760, 510, 0.038, 0.018);
  }
};

const projects: Project[] = [
  { image: '/assets/project-01.png', alt: 'MFB product promotion mobile screen', kind: 'mobile', motion: 'static' },
  { image: '/assets/project-02.png', alt: 'Pay an influencer mobile flow', kind: 'mobile', motion: 'static' },
  { image: '/assets/project-03.png', alt: 'Find the one you trust mobile flow', kind: 'mobile', motion: 'video' },
  { image: '/assets/project-04.png', alt: 'Dark mobile dashboard', kind: 'mobile', motion: 'video' },
  { image: '/assets/project-05.png', alt: 'Explore business mobile flow', kind: 'mobile', motion: 'carousel' },
  { image: '/assets/project-06.png', alt: 'Email verified mobile screen', kind: 'mobile', motion: 'static' },
  { image: '/assets/project-07.png', alt: 'Messaging mobile screen', kind: 'mobile', motion: 'video' },
  { image: '/assets/project-08.png', alt: 'Transparent checkerboard study', kind: 'mobile', motion: 'carousel' },
  { image: '/assets/project-08.png', alt: 'Transparent checkerboard study', kind: 'mobile', motion: 'static' },
  { image: '/assets/project-09.png', alt: 'Insurance web app dashboard', kind: 'web', motion: 'video' },
  { image: '/assets/project-10.png', alt: 'Form builder web app', kind: 'web', motion: 'carousel' },
  { image: '/assets/project-11.png', alt: 'AI video call experience', kind: 'web', motion: 'static' },
  { image: '/assets/project-12.png', alt: 'Elevate your social media presence', kind: 'web', motion: 'video' },
  { image: '/assets/project-13.png', alt: 'Engineering intelligent products for the real world', kind: 'web', motion: 'carousel' },
  { image: '/assets/project-14.png', alt: 'Using the world one video call at a time', kind: 'web', motion: 'video' },
  { image: '/assets/project-15.png', alt: 'Exchange on your own terms', kind: 'web', motion: 'video' },
  { image: '/assets/project-16.png', alt: 'Work faster with Taskify', kind: 'web', motion: 'static' },
  { image: '/assets/project-17.png', alt: 'Meet your new first AI employee', kind: 'web', motion: 'static' },
];

type Experience = {
  company: string;
  website?: string;
  location: string;
  period: string;
  role: string;
  description?: string;
  results?: string[];
};

const experiences: Experience[] = [
  {
    company: 'Cyvi', website: 'https://cyvi.io/', location: 'Sweden', period: 'Nov 2023 - Sep 2025', role: 'Product Designer',
    description: 'At CYVI, I led the design of key platform experiences, including customer, insurer, broker, claims management, and internal administration platforms. Through user research, workflow optimization, and iterative testing, I redesigned the policy checkout journey, reducing completion time by 70% and increasing checkout conversions by 40%. My work helped streamline cyber insurance operations while making the product more accessible to non-technical users.',
  },
  {
    company: 'Vurt', website: 'https://vurt.app/', location: 'Nigeria', period: 'Nov 2021 - Present', role: 'Head of Design',
    description: 'As Head of Design, I directed the design vision, strategy, and execution across all core products, leading a team of designers and partnering closely with product managers, engineers, and business stakeholders. I established scalable design workflows, championed user-centered decision-making, and guided product initiatives from discovery through implementation. I led the complete redesign of the platform from the ground up to support a new exchanger and user ecosystem, enabling the transition from a mobile-first experience to a scalable web platform designed for growth, operational efficiency, and long-term scalability.',
  },
  {
    company: 'PressOne Africa', website: 'https://pressone.africa/meet-juliet/', location: 'Nigeria', period: 'Jan 2026 - Mar 2026', role: 'UX Designer',
    description: 'Designed the website and dashboard experiences for Juliet, an AI-powered business assistant currently handling over 1,000 customer conversations daily. Led the end-to-end UX process, translating complex AI capabilities into intuitive workflows that improved onboarding, customer support efficiency, and user satisfaction.',
    results: ['84% increase in customer onboarding completion', '60% reduction in human-escalated tickets', 'Increase in Customer-satisfaction score from 66% to 92%'],
  },
  {
    company: 'Dysol', website: 'https://www.dysol.ae/', location: 'Dubai', period: 'Jan 2025 - Apr 2026', role: 'Product Designer',
    description: "Worked across multiple client projects as a product design consultant, partnering with stakeholders to define requirements, design user experiences, and deliver high-fidelity solutions. Led the redesign of the company website and directed the visual experience in collaboration with a 3D designer, creating a distinctive digital presence that aligned with the brand's positioning.",
  },
  { company: 'The-Owlet', location: 'Nigeria', period: 'Nov 2023 - Aug 2024', role: 'Product Designer' },
  { company: 'Netact Services Inc.', website: 'https://netactsi.com/', location: 'Canada', period: 'July 2022 - Aug 2023', role: 'Creative Designer' },
];

const competencies = ['Product Strategy', 'User Experience Design', 'Design Systems', 'Information Architecture', 'User Research', 'Interaction Design', 'Design Leadership', 'Cross-functional Collaboration', 'Workshop Facilitation', 'Prototyping'];
const toolsList = ['Figma, FigJam', 'Adobe Creative Suite', 'Claude Code', 'Google Analytics', 'Mixpanel', 'Hotjar', 'ChatGPT', 'Notion', 'Jira'];

function ProjectCard({ project, onOpen }: { project: Project; onOpen: (origin: PreviewOrigin, image: HTMLImageElement) => void }) {
  const [hovered, setHovered] = useState(false);
  const icon = project.motion === 'carousel' ? '/assets/type-carousel.svg' : '/assets/type-video.svg';

  return (
    <button
      className={`project-card project-card--${project.kind}${hovered ? ' is-hovered' : ''}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
      onClick={(event) => {
        const image = event.currentTarget.querySelector<HTMLImageElement>('.project-card__image');
        if (!image) return;
        const rect = image.getBoundingClientRect();
        onOpen({ left: rect.left, top: rect.top, width: rect.width, height: rect.height, radius: parseFloat(getComputedStyle(image).borderRadius) || 0 }, image);
      }}
      aria-label={`Open ${project.alt}`}
    >
      <img className="project-card__image" src={project.image} alt={project.alt} data-reveal />
      {project.motion !== 'static' && (
        <span className="project-card__type" aria-label={project.motion}>
          <img src={icon} alt="" />
        </span>
      )}
      <span className="project-card__hint">{project.alt}</span>
    </button>
  );
}

function ProjectPreview({ project, origin, nativeTransition, onClose }: { project: Project; origin: PreviewOrigin | null; nativeTransition: boolean; onClose: () => void }) {
  const [paused, setPaused] = useState(false);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [saved, setSaved] = useState(false);
  const [shared, setShared] = useState(false);
  const previewImageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => event.key === 'Escape' && onClose();
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [onClose]);

  useLayoutEffect(() => {
    const image = previewImageRef.current;
    if (!image || !origin) return;

    const target = image.getBoundingClientRect();
    image.style.setProperty('--target-radius', getComputedStyle(image).borderRadius);
    image.style.setProperty('--zoom-x', `${origin.left - target.left}px`);
    image.style.setProperty('--zoom-y', `${origin.top - target.top}px`);
    image.style.setProperty('--zoom-scale-x', String(origin.width / target.width));
    image.style.setProperty('--zoom-scale-y', String(origin.height / target.height));
    image.style.setProperty('--zoom-radius', `${origin.radius}px`);
    image.classList.add('zoom-from-card');

    let secondFrame = 0;
    const firstFrame = window.requestAnimationFrame(() => {
      secondFrame = window.requestAnimationFrame(() => image.classList.add('is-settled'));
    });
    const cleanupTimer = window.setTimeout(() => {
      image.classList.remove('zoom-from-card', 'is-settled');
      ['--zoom-x', '--zoom-y', '--zoom-scale-x', '--zoom-scale-y', '--zoom-radius', '--target-radius'].forEach((property) => image.style.removeProperty(property));
    }, 650);

    return () => {
      window.cancelAnimationFrame(firstFrame);
      if (secondFrame) window.cancelAnimationFrame(secondFrame);
      window.clearTimeout(cleanupTimer);
    };
  }, [origin]);

  const carouselProjects = [project, ...projects.filter((item) => item !== project && item.kind === project.kind)].slice(0, 6);
  const displayedProject = project.motion === 'carousel' ? carouselProjects[carouselIndex] : project;
  const changeSlide = (direction: number) => setCarouselIndex((current) => (current + direction + carouselProjects.length) % carouselProjects.length);
  const shareProject = async () => {
    const shareData = { title, text: project.alt, url: window.location.href };
    if (navigator.share) await navigator.share(shareData).catch(() => undefined);
    else await navigator.clipboard.writeText(window.location.href);
    setShared(true);
    window.setTimeout(() => setShared(false), 1400);
  };

  const title = project.motion === 'video'
    ? 'Website mobile interaction'
    : project.motion === 'carousel'
      ? 'Thrift shopping mobile app'
      : project.kind === 'web'
        ? 'Anchor navigation for Privacy policy'
        : project.alt;

  return (
    <div className={`preview${nativeTransition ? ' is-photos-transition' : ''}`} role="dialog" aria-modal="true" aria-label={project.alt} onClick={onClose}>
      <button className="preview__close" onClick={onClose} aria-label="Close preview"><img src="/assets/preview-close.svg" alt="" /></button>
      <div className={`preview__layout preview__layout--${project.kind}${origin || nativeTransition ? ' has-shared-origin' : ''}`} onClick={(event) => event.stopPropagation()}>
        <div className={`preview__media preview__media--${project.kind}`}>
          <img ref={previewImageRef} className="is-in-view" key={displayedProject.image} src={displayedProject.image} alt={displayedProject.alt} data-reveal style={{ viewTransitionName: 'selected-shot' } as CSSProperties} />
          {project.motion === 'video' && (
            <div className="preview__video-controls" aria-label="Video controls">
              <button onClick={() => setPaused(!paused)} aria-label={paused ? 'Play preview' : 'Pause preview'}><span className={paused ? 'play-icon' : 'pause-icon'} /></button>
              <span className={`preview__track${paused ? ' is-paused' : ''}`}><span /></span>
            </div>
          )}
          {project.motion === 'carousel' && (
            <div className="preview__carousel-controls" aria-label="Carousel controls">
              <button className="preview__carousel-button" onClick={() => changeSlide(-1)} aria-label="Previous slide"><img src="/assets/carousel-caret-prev.svg" alt="" /></button>
              <span className="preview__dots" aria-label="Carousel slides">{carouselProjects.map((item, dot) => <button className={`preview__carousel-dot${dot === carouselIndex ? ' is-active' : ''}`} onClick={() => setCarouselIndex(dot)} aria-label={`Go to slide ${dot + 1}`} key={`${item.image}-${dot}`} />)}</span>
              <button className="preview__carousel-button" onClick={() => changeSlide(1)} aria-label="Next slide"><img src="/assets/carousel-caret-next.svg" alt="" /></button>
            </div>
          )}
        </div>
        <article className="preview__details">
          {project.motion !== 'static' && <p className="preview__tag"><img src={project.motion === 'carousel' ? '/assets/type-carousel.svg' : '/assets/type-video.svg'} alt="" />{project.motion}</p>}
          <h2>{title}</h2>
          <p>Lorem ipsum dolor sit amet consectetur. Purus integer est ipsum nec pellentesque pellentesque mollis fames ut. Dui feugiat amet risus in hendrerit. Aliquam viverra elementum purus viverra ultricies augue. Nunc tortor volutpat sapien donec.</p>
          <hr />
          <div className="preview__actions">
            <button className={saved ? 'is-saved' : ''} onClick={() => setSaved(!saved)} aria-pressed={saved} aria-label={saved ? 'Remove saved project' : 'Save project'}><img src="/assets/preview-heart.svg" alt="" /></button>
            <button className={shared ? 'is-shared' : ''} onClick={shareProject} aria-label="Share project"><img src="/assets/preview-share.svg" alt="" /><span className="preview__feedback">{shared ? 'Copied' : 'Share'}</span></button>
          </div>
        </article>
      </div>
    </div>
  );
}

function Profile({ id }: { id?: string } = {}) {
  return (
    <header className="profile">
      <div className="profile__heading">
        <img className="profile__portrait" src="/assets/portrait.png" alt="Mofifoluwa Olawuyi" data-reveal />
        <div>
          <h1 id={id}>Mofifoluwa.</h1>
          <p className="profile__role">Product designer</p>
        </div>
      </div>
      <div className="profile__bio">
        <p>I design products for messy, high-stakes spaces — fintech, insurance, AI, enterprise SaaS — where the requirements are usually vague and the stakes for getting it wrong are real. My job is turning that ambiguity into something people can actually use.</p>
        <p>I’ve led teams through that whole process, from early research to shipped systems, and I care a lot about what happens after launch: does this still make sense when the product doubles in size? That’s usually where I spend my energy — not just the screen in front of me, but the patterns underneath it.</p>
      </div>
    </header>
  );
}

function ResumeAside() {
  const groups = [
    ['Core Competencies', competencies],
    ['Tools', toolsList],
  ] as const;

  return (
    <aside className="resume-aside" aria-label="Résumé details">
      {groups.map(([heading, items]) => (
        <section className="resume-aside__group" key={heading}>
          <h2>{heading}</h2>
          <ul>{items.map((item) => <li key={item}>{item}</li>)}</ul>
        </section>
      ))}
      <section className="resume-aside__group">
        <h2>Education</h2>
        <div className="resume-education"><span>Bsc. Computer Science</span></div>
        <p>Redeemer’s University, Nigeria</p>
      </section>
      <div className="resume-download">
        <a className="resume-download__linkedin" href="https://www.linkedin.com/in/mofifoluwa-olawuyi-04bb73214/" target="_blank" rel="noreferrer" aria-label="Open LinkedIn profile"><img src="/assets/icon-linkedin.svg" alt="" /></a>
        <button onClick={() => window.print()}><img src="/assets/icon-download.svg" alt="" />DOWNLOAD</button>
      </div>
    </aside>
  );
}

type NavigationDirection = 'forward' | 'backward';

function ResumePage({ direction }: { direction: NavigationDirection }) {
  return (
    <div className="resume-shell">
      <Profile />
      <div className={`portfolio-bottom portfolio-bottom--${direction}`}>
        <div className="resume-layout">
          <ResumeAside />
          <section className="resume-experience" aria-label="Work experience">
            {experiences.map((experience) => <ExperienceCard experience={experience} key={`${experience.company}-${experience.period}`} />)}
          </section>
        </div>
      </div>
    </div>
  );
}

function ExperienceCard({ experience }: { experience: Experience }) {
  const cardRef = useRef<HTMLElement>(null);
  const [companyHover, setCompanyHover] = useState(false);
  const [pointer, setPointer] = useState({ x: 69, y: 35 });
  const pointerStyle = {
    '--company-hover-x': `${pointer.x}px`,
    '--company-hover-y': `${pointer.y}px`,
  } as CSSProperties;

  const updatePointer = (event: ReactPointerEvent<HTMLElement>) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    setPointer({ x: event.clientX - rect.left, y: event.clientY - rect.top });
  };

  const showAtCompany = (event: ReactFocusEvent<HTMLElement>) => {
    const card = cardRef.current;
    const company = event.currentTarget.getBoundingClientRect();
    if (!card) return;
    const rect = card.getBoundingClientRect();
    setPointer({ x: company.left - rect.left + company.width / 2 + 14, y: company.top - rect.top + company.height / 2 });
    setCompanyHover(true);
  };

  const hideOnBlur = (event: ReactFocusEvent<HTMLElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setCompanyHover(false);
  };

  return (
    <article className="experience-card" ref={cardRef}>
      <div className="experience-card__heading">
        <div>
          {experience.website ? (
            <span className="experience-card__company-trigger" onPointerEnter={() => setCompanyHover(true)} onPointerMove={updatePointer} onPointerLeave={() => setCompanyHover(false)} onFocus={showAtCompany} onBlur={hideOnBlur}>
              <a className="experience-card__company" href={experience.website} target="_blank" rel="noreferrer">{experience.company}</a>
            </span>
          ) : <strong>{experience.company}</strong>}
          <span>, {experience.location}</span>
        </div>
        <time>{experience.period}</time>
      </div>
      <p className="experience-card__role">{experience.role}</p>
      {experience.description && <p className="experience-card__description">{experience.description}</p>}
      {experience.results && <div className="experience-card__results"><strong>The result?</strong><ul>{experience.results.map((result) => <li key={result}>{result}</li>)}</ul></div>}
      {experience.website && companyHover && (
        <>
          <span className="experience-card__hover-chip" style={pointerStyle} aria-hidden="true">{new URL(experience.website).hostname.replace(/^www\./, '')}</span>
        </>
      )}
    </article>
  );
}

const socialLinks = [
  ['Mail', 'mailto:hello@mofi.design', '/assets/icon-mail.svg'],
  ['LinkedIn', 'https://www.linkedin.com/in/mofifoluwa-olawuyi-04bb73214/', '/assets/icon-linkedin.svg'],
  ['Twitter', 'https://x.com/designedbyMofi', '/assets/icon-twitter.svg'],
  ['Instagram', 'https://www.instagram.com/mofifoluwaa/', '/assets/icon-instagram.svg'],
] as const;

const bookingLink = 'https://cal.com/mofifoluwa-olawuyi-74cy24/30min';

function RecordPlayer() {
  return (
    <div className="record-player" aria-hidden="true">
      <img className="record-player__base" src="/assets/record-player.png" alt="" data-reveal />
      <img className="record-player__disc" src="/assets/record.png" alt="" data-reveal />
      <img className="record-player__arm" src="/assets/tonearm.png" alt="" data-reveal />
    </div>
  );
}

function Footer() {
  const [copied, setCopied] = useState(false);
  const copyResetTimerRef = useRef<number | null>(null);
  const [socialHoverIndex, setSocialHoverIndex] = useState<number | null>(null);
  const copyEmail = async () => {
    void navigator.clipboard?.writeText?.('hello@mofi.design')?.catch(() => undefined);
    setCopied(true);
    if (copyResetTimerRef.current) window.clearTimeout(copyResetTimerRef.current);
    copyResetTimerRef.current = window.setTimeout(() => {
      setCopied(false);
      copyResetTimerRef.current = null;
    }, 1600);
  };

  return (
    <footer className="footer" id="contact">
      <div className="footer__inner">
        <div className="footer__top">
          <div className="listening">
            <RecordPlayer />
            <div>
              <span>Listening to</span>
              <p><strong>Almeda</strong> by Solange</p>
            </div>
          </div>
          <nav
            className="social-list"
            aria-label="Social links"
            onPointerLeave={() => setSocialHoverIndex(null)}
            onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setSocialHoverIndex(null); }}
            style={{
              '--footer-hover-index': String(socialHoverIndex ?? 0),
              '--footer-hover-row': String((socialHoverIndex ?? 0) % 2),
              '--footer-hover-column': String(Math.floor((socialHoverIndex ?? 0) / 2)),
            } as CSSProperties}
          >
            <span className={`footer-social-slider__pill${socialHoverIndex === null ? '' : ' is-visible'}`} aria-hidden="true" />
            {socialLinks.map(([label, href, icon], index) => (
              <a key={label} href={href} target={href.startsWith('http') ? '_blank' : undefined} rel="noreferrer" onPointerEnter={() => setSocialHoverIndex(index)} onFocus={() => setSocialHoverIndex(index)}>
                <span>{label}</span><span className="social-icon" style={{ '--social-icon': `url("${icon}")` } as CSSProperties} aria-hidden="true" />
              </a>
            ))}
          </nav>
        </div>
        <div className="footer__cta">
          <p>Have a project in mind? Let’s talk!</p>
          <a href="mailto:hello@mofi.design">hello@mofi.design</a>
          <div className="footer__actions">
            <button className={`copy-email${copied ? ' is-copied' : ''}`} onClick={copyEmail}>
              <span className="copy-email__icon" key={copied ? 'icon-check' : 'icon-copy'} aria-hidden="true">{copied ? <span className="check-icon copy-check is-visible" /> : <img className="copy-email__copy-icon" src="/assets/icon-copy.svg" alt="" />}</span>
              <span className="copy-email__label" key={copied ? 'label-copied' : 'label-copy'}>{copied ? 'COPIED' : 'COPY'}</span>
              {copied && <span className="copy-confetti" aria-hidden="true">{[
                [-30, -22], [-21, -31], [-12, -40], [-3, -47], [7, -44], [17, -35], [27, -24],
                [-25, -15], [-15, -27], [-5, -35], [6, -33], [16, -25], [24, -14],
                [-18, -10], [-8, -18], [9, -18], [18, -9],
              ].map(([x, y], index) => <i key={index} style={{
                '--confetti-x': `${x * 3}px`,
                '--confetti-y': `${y * 1.35}px`,
                '--confetti-delay': `${(index % 6) * 22}ms`,
                '--confetti-rotation': `${-90 + index * 43}deg`,
                '--confetti-color': ['#f1d7c5', '#c9d9d3', '#e7c8d6', '#d7c9e8', '#f0dfb8'][index % 5],
                '--confetti-shape': index % 4 === 0 ? '50%' : '1.5px',
                '--confetti-scale': index % 5 === 0 ? '.78' : '1',
              } as CSSProperties} />)}</span>}
            </button>
            <a href={bookingLink} onClick={(event) => event.preventDefault()} data-cal-namespace="30min" data-cal-link="mofifoluwa-olawuyi-74cy24/30min" data-cal-config='{"layout":"month_view","useSlotsViewOnSmallScreen":"true","theme":"light"}'><span className="book-call-icon" aria-hidden="true" />BOOK A CALL</a>
          </div>
        </div>
        <div className="footer__legal"><span>© 2026, Mofifoluwa Olawuyi.</span><span>v1.0</span></div>
      </div>
    </footer>
  );
}

function ScrolledHeader({ active, projectDetail, onBack, onNavigate }: { active: PortfolioView; projectDetail: boolean; onBack: () => void; onNavigate: (view: PortfolioView) => void }) {
  const [visible, setVisible] = useState(projectDetail);

  const shareProject = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: 'Vurt — Mofifoluwa', url }).catch(() => undefined);
      return;
    }
    await navigator.clipboard?.writeText(url);
  };

  useEffect(() => {
    const update = () => setVisible(projectDetail || window.scrollY > 360);
    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, [projectDetail]);

  return (
      <div className={`scrolled-header${visible ? ' is-visible' : ''}`} aria-hidden={!visible}>
      <div className={`scrolled-header__content${projectDetail ? ' is-project' : ''}`}>
        {projectDetail && <button className="scrolled-header__back has-tooltip" data-tooltip="Back" onClick={onBack} aria-label="Back to projects"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M10.8284 12.0007L15.7782 16.9504L14.364 18.3646L8 12.0007L14.364 5.63672L15.7782 7.05093L10.8284 12.0007Z" /></svg></button>}
        <div className="scrolled-header__identity">
          <img src="/assets/portrait.png" alt="" />
          <a className={`scrolled-header__crumb${active === 'shots' && !projectDetail ? ' scrolled-header__active' : ''}`} href="/" onClick={(event) => { event.preventDefault(); onNavigate('shots'); }}>Mofifoluwa</a><span className="scrolled-header__muted">/</span>
          {projectDetail ? <a className="scrolled-header__crumb" href="/projects" onClick={(event) => { event.preventDefault(); onBack(); }}>Projects</a> : active === 'projects' ? <a className="scrolled-header__crumb scrolled-header__active" href="/projects" onClick={(event) => event.preventDefault()}>Projects</a> : active === 'resume' ? <a className="scrolled-header__crumb scrolled-header__active" href="/resume" onClick={(event) => event.preventDefault()}>Résumé</a> : <a className="scrolled-header__crumb scrolled-header__active" href="/" onClick={(event) => event.preventDefault()}>Shots</a>}
          {projectDetail && <><span className="scrolled-header__muted scrolled-header__vurt-separator">/</span><span className="scrolled-header__muted scrolled-header__current">Vurt</span></>}
          <span className="scrolled-header__muted">·</span>
          <a href={bookingLink} onClick={(event) => event.preventDefault()} data-cal-namespace="30min" data-cal-link="mofifoluwa-olawuyi-74cy24/30min" data-cal-config='{"layout":"month_view","useSlotsViewOnSmallScreen":"true","theme":"light"}'>Book a call</a>
        </div>
        {projectDetail && <button className="scrolled-header__share has-tooltip" data-tooltip="Share" onClick={shareProject} aria-label="Share project"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M13 14H11C7.54202 14 4.53953 15.9502 3.03239 18.8107C3.01093 18.5433 3 18.2729 3 18C3 12.4772 7.47715 8 13 8V3L23 11L13 19V14Z" /></svg></button>}
      </div>
    </div>
  );
}

function ProjectsLanding({ onOpenVurt, direction }: { onOpenVurt: () => void; direction: NavigationDirection }) {
  return (
    <section className="projects-landing" aria-labelledby="projects-title">
      <div className="projects-landing__profile"><Profile id="projects-title" /></div>
      <div className={`portfolio-bottom portfolio-bottom--${direction}`}>
        <div className="projects-landing__work"><p className="projects-landing__eyebrow">My work</p>
          <button className="projects-landing__card" onClick={onOpenVurt}><span className="projects-landing__placeholder" /><span><h2>Vurt: Designing trust into currency exchange</h2><p>Lorem ipsum dolor sit amet consectetur. Purus integer est ipsum nec pellentesque pellentesque mollis fames ut. Dui feugiat amet risus in hendrerit.</p></span></button>
          <div className="projects-landing__card"><span className="projects-landing__placeholder" /><span><h2>Corddit: Connecting people with similar interests</h2><p>Lorem ipsum dolor sit amet consectetur. Purus integer est ipsum nec pellentesque pellentesque mollis fames ut. Dui feugiat amet risus in hendrerit.</p></span></div>
        </div>
      </div>
    </section>
  );
}

const vurtSections = [
  { id: 'vurt-intro', number: '01', nav: 'Intro', title: 'Currency gets its value from people, not just banks.', paragraphs: ['Vurt began as QPay, a mobile-first exchange app for people moving money across currencies. The first version proved the need, but it made a high-stakes transaction feel harder than it needed to be.', 'The redesign turned that early product into a P2P marketplace: customers could compare offers and choose who to trade with, while Vurt handled the coordination and risk underneath.'] },
  { id: 'vurt-metrics', number: '02', nav: 'Metrics', title: 'The clearest signal came from onboarding.', paragraphs: ['Onboarding completion rose from 26% to 67.6% after the redesign—a 160% increase.', 'That was the clearest evidence that reducing the first-use burden was doing its job. The Beta’s early traction gave us a second signal: people were willing to return when the exchange felt useful and dependable.'] },
  { id: 'vurt-role', number: '03', nav: 'My role', title: 'I owned the product direction from strategy to handoff.', paragraphs: ['As Head of Design and Product, I led the product strategy, UX, UI, and design system across the customer and exchanger experiences.', 'The team was one product manager, three developers, and three designers. I handled the core product direction and worked closely with stakeholders throughout. The other designers extended the system across mobile viewports and features such as KYC, bank-account listing, and exchanger ads.'] },
  { id: 'vurt-opportunity', number: '04', nav: 'Opportunity', title: 'Making rates easier to compare and exchanges safer to complete.', paragraphs: ['New startups were offering similar solutions, while traditional exchangers were still relying on WhatsApp, Telegram, and in-person conversations. The opportunity was bigger than a visual refresh: Vurt could give both sides a better way to do business.', 'For customers, that meant clearer choices and a faster path to payment. For exchangers, it meant bringing existing customers online without asking them to abandon the relationships they had already built.'] },
  { id: 'vurt-problem', number: '05', nav: 'The problem', title: 'The core problem was not just finding a good rate. It was trusting the exchange.', paragraphs: ['A customer needed confidence at the exact moment money left their account: what would they receive, who would receive their deposit, how long would it take, and what protection existed if the transaction failed?', 'The exchanger had their own problems. Manual transfers created opening hours, delays, and exposure to risk. The product had to make the exchange feel immediate for the customer while keeping the underlying transaction controlled.'] },
  { id: 'vurt-context', number: '06', nav: 'Context', title: 'We used a small beta to test the marketplace model.', paragraphs: ['The Beta was the first time we put multiple exchangers in the same product. Three internal exchangers supplied rates at different times of day, but all appeared under the QPay name.', 'Over two weeks, 400+ people used the platform and 109 came back for another exchange. With almost no marketing, the experiment proved that customers were willing to compare offers, and that the marketplace model could support repeat behaviour.'] },
  { id: 'vurt-process', number: '07', nav: 'Process', title: 'I treated the redesign as a product-system problem.', paragraphs: ['I started with the moments where confidence could break: account creation, choosing an offer, making payment, waiting for resolution, and managing an exchange as a provider.', 'We combined competitor analysis, Beta behaviour, stakeholder input, and our own experience as customers and exchangers. I then translated those findings into the design system, interaction patterns, and implementation decisions, working with the PM and developers throughout.'] },
  { id: 'vurt-marketplace', number: '08.1', label: 'Solution - Marketplace', nav: 'Solution', title: 'Putting the decision in one clear place.', paragraphs: ['The exchanger card became the centre of the marketplace. It answers the questions a customer has before committing: what rate am I getting, who am I dealing with, and how will the exchange work?', 'Rate, limits, response time, trade count, reviews, and verification status sit in one hierarchy. Buy and Generate payment link stay close to the offer, so the action follows the decision instead of starting another search.', 'Payoneer, PayPal, and foreign/domiciliary accounts are separated into tabs. Desktop supports quick comparison across offers; mobile keeps the same information legible in a single scroll.'], media: true },
  { id: 'vurt-onboarding', number: '08.2', label: 'Solution - Onboarding', nav: 'Solution', title: 'Letting people understand the exchange before asking for commitment.', paragraphs: ['The original flow asked for an account before users had seen enough value. In the new flow, a customer can choose an exchanger, enter an amount, and see the expected return before signing up.', 'The registration flow is only triggered when payment details are needed. Exchange links take the same idea further: an exchanger can send an existing customer directly to their offer, turning a WhatsApp or Telegram conversation into a structured transaction.'], media: true },
  { id: 'vurt-trust', number: '08.3', label: 'Solution - Trust', nav: 'Solution', title: 'Designing the system state, not just the happy path.', paragraphs: ['The key concern: what stops an exchanger from taking the money and disappearing?', 'We implemented an internal escrow system. Customer funds move into an account provided through a partner bank, and the equivalent amount is held until the exchange is confirmed. If resolution fails, the exchanger cannot withdraw the funds from Vurt.', 'The interface makes that protection legible through verified profiles, trade history, response times, reviews, and a progress card that shows where the exchange is. The system does the heavy lifting; the UI gives the customer enough evidence to keep moving.'], media: true },
  { id: 'vurt-platform', number: '08.4', label: 'Solution - Platform', nav: 'Solution', title: 'Moving to web before adding more surface area.', paragraphs: ['We decided to transition to a web platform based on feedback from the beta test and the newly onboarded exchangers. The first interaction needed to be easy to share and easy to access. Asking someone to download an app before their first exchange was unnecessary friction.', 'The dashboard gives customers a home for their money exchanged, transactions, settings, and recent activity. It also gives exchangers room to manage KYC, bank accounts, offers, and payment links. A customer can pay an invoice link without installing the app just to complete one payment.'], media: true },
  { id: 'vurt-invoicing', number: '08.5', label: 'Solution - Invoicing links', nav: 'Solution', title: 'Giving freelancers a simple way to get paid.', paragraphs: ['Several test customers asked for a way to collect payments from their own clients. They did not want to explain exchange details every time or ask someone to download an app for a single payment.', 'Invoice links let a freelancer create a payment request with the information a proper invoice needs: the amount, currency, exchange rate, payment details, and due date. Vurt generates a shareable link that the client can open, review, and pay from the web.', 'The payment first goes directly into the exchanger’s account. Vurt then reconciles the payment through the exchange flow, converts the value, and settles the exchanged amount into the freelancer’s receiving account. This keeps the client’s payment simple while the platform handles the currency conversion and settlement underneath.'], media: true },
  { id: 'vurt-impact', number: '09', nav: 'Impact', title: 'The redesign improved the first step.', paragraphs: ['Onboarding completion rose from 26% to 67.6%, a 160% increase.', 'The Beta also gave us meaningful early traction: 400+ users and 109 repeat users in two weeks with almost no marketing. The current product is preparing for launch with a stronger foundation for comparison, trust, and reliable resolution.'] },
  { id: 'vurt-feedback', number: '10', nav: 'Feedback from users', title: 'The strongest feedback was behavioural.', paragraphs: ['The most useful feedback was not a comment. It was what people did next. Users returned because they could find a rate that worked for them without giving up the familiarity of their exchanger.', 'That behaviour reinforced the product direction: customers wanted control over the price, but they also needed the experience to feel safe, visible, and predictable from payment to resolution. The invoice-link request showed the same pattern: customers were telling us where the platform could remove work beyond the core exchange.'] },
  { id: 'vurt-lessons', number: '11', nav: 'Lessons learnt', title: 'Systems not just screens', bullets: ['Trust is a product behaviour, not a visual layer.', 'In a two-sided marketplace, every customer decision affects another user.', 'Progressive disclosure can remove friction without hiding important information.', 'Operational constraints should shape the experience from the start.', 'Repeat behaviour is stronger evidence than positive feedback alone.', 'A web-first product can validate demand before adding the cost of a mobile app.', 'The best adjacent features often come directly from what customers are already trying to do.'], paragraphs: ['Vurt taught me to design the operational model and the interface as one experience—and to keep listening for the adjacent problems that make the core product more useful.'] },
];

function VurtMobileIndex() {
  const [active, setActive] = useState(1);
  const [mobileIndexTop, setMobileIndexTop] = useState(205);
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const sections = vurtSections.map((section) => document.getElementById(section.id)).filter(Boolean) as HTMLElement[];
      let next = 0;
      sections.forEach((section, index) => { if (section.getBoundingClientRect().top <= 230) next = index; });
      setActive(next);
      const scrollRoot = document.scrollingElement || document.documentElement;
      const viewportHeight = window.innerHeight;
      const documentHeight = Math.max(viewportHeight, scrollRoot.scrollHeight);
      const maxScroll = Math.max(1, documentHeight - viewportHeight);
      const scrollTop = Math.min(maxScroll, Math.max(0, scrollRoot.scrollTop || window.scrollY));
      const scrollbarThumbHeight = Math.min(viewportHeight, Math.max(24, (viewportHeight * viewportHeight) / documentHeight));
      const scrollbarTrack = Math.max(0, viewportHeight - scrollbarThumbHeight);
      const nextTop = Math.max(8, Math.min(viewportHeight - 40, scrollbarThumbHeight / 2 + (scrollTop / maxScroll) * scrollbarTrack - 16));
      setMobileIndexTop(nextTop);
    };
    const scheduleUpdate = () => { if (!frame) frame = window.requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', scheduleUpdate, { passive: true });
    window.addEventListener('resize', scheduleUpdate);
    return () => {
      window.removeEventListener('scroll', scheduleUpdate);
      window.removeEventListener('resize', scheduleUpdate);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);
  return <aside className="vurt-mobile-index" aria-hidden="true" style={{ top: `${mobileIndexTop}px` }}><span>{vurtSections[active]?.nav}</span></aside>;
}

function VurtCaseStudy({ direction }: { direction: NavigationDirection }) {
  const [tocHoverIndex, setTocHoverIndex] = useState<number | null>(null);
  const [tocActiveIndex, setTocActiveIndex] = useState(7);
  const tocRef = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    const toc = tocRef.current;
    const row = toc?.querySelector('a');
    if (!toc || !row) return;
    const updateRowHeight = () => toc.style.setProperty('--toc-row-height', `${row.getBoundingClientRect().height}px`);
    updateRowHeight();
    const observer = new ResizeObserver(updateRowHeight);
    observer.observe(row);
    return () => observer.disconnect();
  }, []);
  const navSections = vurtSections.filter((section, index) => section.number !== '08.2' && section.number !== '08.3' && section.number !== '08.4' && section.number !== '08.5' && index < 16);
  useEffect(() => {
    let frame = 0;
    const updateActiveSection = () => {
      frame = 0;
      let nextIndex = 0;
      navSections.forEach((section, index) => {
        const element = document.getElementById(section.id);
        if (element && element.getBoundingClientRect().top <= 180) nextIndex = index;
      });
      setTocActiveIndex(nextIndex);
    };
    const scheduleUpdate = () => {
      if (!frame) frame = window.requestAnimationFrame(updateActiveSection);
    };
    updateActiveSection();
    window.addEventListener('scroll', scheduleUpdate, { passive: true });
    return () => {
      window.removeEventListener('scroll', scheduleUpdate);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [navSections.length]);
  const handleTocClick = (event: ReactMouseEvent<HTMLAnchorElement>, id: string, index: number) => {
    event.preventDefault();
    setTocActiveIndex(index);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    window.history.replaceState(null, '', `#${id}`);
  };
  return (
    <article className={`case-study case-study--${direction}`} aria-labelledby="vurt-title">
      <header className="case-study__hero">
        <div className="case-study__profile"><h1 id="vurt-title">Vurt v3: Designing trust into currency exchange</h1><p className="case-study__lede">I led the redesign of Vurt from a rough mobile exchange app into a responsive platform for customers and exchangers.</p></div>
      <div className="case-study__hero-card"><div className="case-study__hero-placeholder" aria-label="Vurt exchange marketplace preview" /><div className="case-study__hero-chips"><a href="https://vurt.app/" target="_blank" rel="noreferrer"><svg className="case-study__link-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22ZM9.71002 19.6674C8.74743 17.6259 8.15732 15.3742 8.02731 13H4.06189C4.458 16.1765 6.71639 18.7747 9.71002 19.6674ZM10.0307 13C10.1811 15.4388 10.8778 17.7297 13.9693 13H10.0307ZM19.9381 13H15.9727C15.8427 15.3742 15.2526 17.6259 14.29 19.6674C17.2836 18.7747 19.542 16.1765 19.9381 13ZM4.06189 11H8.02731C8.15732 8.62577 8.74743 6.37407 9.71002 4.33256C6.71639 5.22533 4.458 7.8235 4.06189 11ZM10.0307 11H13.9693C13.8189 8.56122 13.1222 6.27025 12 4.24799C10.8778 6.27025 10.1811 8.56122 10.0307 11ZM14.29 4.33256C15.2526 6.37407 15.8427 8.62577 15.9727 11H19.9381C19.542 7.8235 17.2836 5.22533 14.29 4.33256Z" /></svg><span>vurt.app</span></a><span>2025 - 2026</span></div></div>
      </header>
      <div className="case-study__rule" />
      <nav ref={tocRef} className="case-study__toc case-study__toc--animated" aria-label="Case study sections" onPointerLeave={() => setTocHoverIndex(null)} style={{ '--popup-hover-index': String(tocHoverIndex ?? 0) } as CSSProperties}>
        <span className={`popup-hover-slider${tocHoverIndex === null ? '' : ' is-visible'}`} aria-hidden="true" />
        {navSections.map((section, index) => <a key={section.id} href={`#${section.id}`} className={index === tocActiveIndex ? 'is-active' : ''} onClick={(event) => handleTocClick(event, section.id, index)} onPointerEnter={() => setTocHoverIndex(index)} onFocus={() => setTocHoverIndex(index)}><b>{section.number.split('.')[0]}</b><span>{section.nav}</span></a>)}
      </nav>
      <div className="case-study__content">
        {vurtSections.map((section) => <section className={`case-study__entry${section.media ? ' case-study__entry--media' : ''}`} id={section.id} data-vurt-section key={section.id}>
          <div className="case-study__entry-heading"><span>{section.number}: {section.label || section.nav}</span><h2>{section.title}</h2></div>
          {section.paragraphs?.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          {section.bullets && <ul>{section.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ul>}
          {section.media && <div className="case-study__placeholder" aria-hidden="true" />}
        </section>)}
      </div>
      <VurtMobileIndex />
    </article>
  );
}

function FloatingNavigation({ active, onNavigate, filter, onFilter, muted, onMutedChange }: { active: PortfolioView; onNavigate: (view: PortfolioView) => void; filter: ShotFilter; onFilter: (filter: ShotFilter) => void; muted: boolean; onMutedChange: (muted: boolean) => void }) {
  const [socialsOpen, setSocialsOpen] = useState(false);
  const [shotsOpen, setShotsOpen] = useState(false);
  const [shotsHoverIndex, setShotsHoverIndex] = useState<number | null>(null);
  const [linksHoverIndex, setLinksHoverIndex] = useState<number | null>(null);
  const navRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let frame = 0;

    const positionWithinMain = () => {
      frame = 0;
      const nav = navRef.current;
      const main = nav?.closest('main');
      if (!nav || !main) return;

      const offset = Math.min(0, main.getBoundingClientRect().bottom - window.innerHeight);
      nav.style.setProperty('--main-edge-offset', `${offset}px`);
    };

    const schedulePosition = () => {
      if (!frame) frame = window.requestAnimationFrame(positionWithinMain);
    };

    positionWithinMain();
    window.addEventListener('scroll', schedulePosition, { passive: true });
    window.addEventListener('resize', schedulePosition);

    return () => {
      window.removeEventListener('scroll', schedulePosition);
      window.removeEventListener('resize', schedulePosition);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    const closeMenus = (event: PointerEvent) => {
      if (!navRef.current?.contains(event.target as Node)) {
        setSocialsOpen(false);
        setShotsOpen(false);
      }
    };
    document.addEventListener('pointerdown', closeMenus);
    return () => document.removeEventListener('pointerdown', closeMenus);
  }, []);

  const filterItems: Array<[ShotFilter, string]> = [['others', 'Others'], ['web', 'Websites'], ['dashboards', 'Dashboards'], ['mobile', 'Mobile apps'], ['all', 'All shots']];
  const popupSocialLinks = socialLinks.slice().reverse();

  return (
    <div className="floating-nav" ref={navRef}>
      <div className="floating-nav__capsule">
        <img className="floating-nav__avatar" src="/assets/nav-avatar.png" alt="" />
        <div className="floating-nav__tabs" role="tablist" aria-label="Portfolio sections" style={{ '--active-index': String((['shots', 'projects', 'resume'] as const).indexOf(active)) } as CSSProperties}>
          <span className="floating-nav__active-slider" aria-hidden="true" />
          {shotsOpen && active === 'shots' && <div className="shots-filter-menu popup-slider-menu" role="menu" onPointerLeave={() => setShotsHoverIndex(null)} style={{ '--popup-hover-index': String(shotsHoverIndex ?? 0) } as CSSProperties}>
            <span className={`popup-hover-slider${shotsHoverIndex === null ? '' : ' is-visible'}`} aria-hidden="true" />
            {filterItems.map(([value, label], index) => <button className={filter === value ? 'is-selected' : ''} role="menuitemradio" aria-checked={filter === value} key={value} onPointerEnter={() => setShotsHoverIndex(index)} onFocus={() => setShotsHoverIndex(index)} onClick={() => { onFilter(value); setShotsOpen(false); setShotsHoverIndex(null); }}><span>{label}</span><span className="shots-filter-menu__status" aria-hidden="true">{filter === value ? <span className="check-icon filter-check" /> : '·'}</span></button>)}
          </div>}
          {(['shots', 'projects', 'resume'] as const).map((tab) => (
            <button
              key={tab}
              role="tab"
              aria-selected={active === tab}
              aria-haspopup={tab === 'shots' && active === 'shots' ? 'menu' : undefined}
              aria-expanded={tab === 'shots' && active === 'shots' ? shotsOpen : undefined}
              className={`${active === tab ? 'is-active ' : ''}${tab === 'shots' ? 'shots-toggle' : ''}`.trim()}
              onClick={() => {
                if (tab === 'projects') {
                  setShotsOpen(false);
                  setSocialsOpen(false);
                  onNavigate('projects');
                  return;
                }
                if (tab === 'shots' && active === 'shots') {
                  setShotsOpen(!shotsOpen);
                  setSocialsOpen(false);
                  return;
                }
                onNavigate(tab);
              }}
            >
              <span>{tab === 'resume' ? 'Résumé' : tab[0].toUpperCase() + tab.slice(1)}</span>
              {tab === 'shots' && active === 'shots' && <span className="shots-toggle__icon" aria-hidden="true" />}
            </button>
          ))}
        </div>
        <div className="floating-nav__social-wrap">
          {socialsOpen && <div className="floating-nav__socials popup-slider-menu" onPointerLeave={() => setLinksHoverIndex(null)} style={{ '--popup-hover-index': String(linksHoverIndex ?? 0) } as CSSProperties}>
            <span className={`popup-hover-slider${linksHoverIndex === null ? '' : ' is-visible'}`} aria-hidden="true" />
            {popupSocialLinks.map(([label, href, icon], index) => <a key={label} href={href} target={href.startsWith('http') ? '_blank' : undefined} rel={href.startsWith('http') ? 'noreferrer' : undefined} onPointerEnter={() => setLinksHoverIndex(index)} onFocus={() => setLinksHoverIndex(index)}><span>{label}</span><span className="social-icon" style={{ '--social-icon': `url("${icon}")` } as CSSProperties} aria-hidden="true" /></a>)}
          </div>}
          <button className="floating-nav__icon has-tooltip" data-tooltip="Links" onClick={() => { setSocialsOpen(!socialsOpen); setLinksHoverIndex(null); setShotsOpen(false); setShotsHoverIndex(null); }} aria-expanded={socialsOpen} aria-label="Social links"><img src={socialsOpen ? '/assets/nav-close.svg' : '/assets/nav-grid.svg'} alt="" /></button>
        </div>
        <button
          className="floating-nav__icon has-tooltip"
          data-tooltip={muted ? 'Sound' : 'Mute'}
          data-sound="silent"
          onClick={() => {
            const nextMuted = !muted;
            if (nextMuted) playUiSound('toggle');
            setUiSoundMuted(nextMuted);
            onMutedChange(nextMuted);
            if (!nextMuted) playUiSound('toggle');
          }}
          aria-pressed={muted}
          aria-label={muted ? 'Unmute interface sounds' : 'Mute interface sounds'}
        ><img src={muted ? '/assets/nav-muted.svg' : '/assets/nav-sound.svg'} alt="" /></button>
      </div>
    </div>
  );
}

export default function App() {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [previewOrigin, setPreviewOrigin] = useState<PreviewOrigin | null>(null);
  const [nativePreviewTransition, setNativePreviewTransition] = useState(false);
  const [view, setView] = useState<PortfolioView>(() => viewFromPath());
  const [navigationDirection, setNavigationDirection] = useState<NavigationDirection>('forward');
  const [projectDetail, setProjectDetail] = useState(() => isVurtCaseStudyPath());
  const [shotFilter, setShotFilter] = useState<ShotFilter>('all');
  const [muted, setMuted] = useState(() => window.localStorage.getItem('portfolio-sounds-muted') === 'true');
  const initialViewRef = useRef(view);

  useEffect(() => {
    const initialShots = initialViewRef.current === 'shots';
    if (initialShots) document.documentElement.classList.add('initial-shots');
    const readyTimer = window.setTimeout(() => document.documentElement.classList.add('app-ready'), 1050);
    return () => {
      window.clearTimeout(readyTimer);
      document.documentElement.classList.remove('app-ready');
      document.documentElement.classList.remove('initial-shots');
    };
  }, []);

  useEffect(() => {
    setUiSoundMuted(muted);
    document.documentElement.classList.toggle('is-muted', muted);
    window.localStorage.setItem('portfolio-sounds-muted', String(muted));
    return () => document.documentElement.classList.remove('is-muted');
  }, [muted]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const cal = await getCalApi({ namespace: '30min' });
      if (cancelled) return;
      cal('ui', {
        theme: 'light',
        cssVarsPerTheme: { light: { 'cal-brand': '#FAF8F6' }, dark: { 'cal-brand': '#FAF8F6' } },
        hideEventTypeDetails: false,
        layout: 'month_view',
      });
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const syncViewFromHistory = () => {
      setSelectedProject(null);
      setPreviewOrigin(null);
      setNativePreviewTransition(false);
      setView(viewFromPath());
      setProjectDetail(isVurtCaseStudyPath());
      window.requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
    };

    window.addEventListener('popstate', syncViewFromHistory);
    return () => window.removeEventListener('popstate', syncViewFromHistory);
  }, []);

  useEffect(() => {
    const soundForTarget = (target: EventTarget | null) => {
      if (!(target instanceof Element)) return;
      const control = target.closest<HTMLElement>('button, a, [role="tab"], [role="menuitem"]');
      if (!control || control.dataset.sound === 'silent' || control.getAttribute('aria-disabled') === 'true') return;

      let sound: UiSound = 'click';
      if (control.dataset.sound) sound = control.dataset.sound as UiSound;
      else if (control.matches('.project-card')) sound = 'open';
      else if (control.matches('.preview__close')) sound = 'close';
      else if (control.closest('.floating-nav__tabs')) sound = 'navigation';
      else if (control.closest('.shots-filter-menu, .preview__carousel-controls')) sound = 'select';
      else if (control.closest('.preview__actions, .footer__actions')) sound = 'confirm';
      playUiSound(sound);
    };

    const onPointerDown = (event: PointerEvent) => soundForTarget(event.target);
    const onKeyboardClick = (event: MouseEvent) => { if (event.detail === 0) soundForTarget(event.target); };
    document.addEventListener('pointerdown', onPointerDown, true);
    document.addEventListener('click', onKeyboardClick, true);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true);
      document.removeEventListener('click', onKeyboardClick, true);
    };
  }, []);

  useEffect(() => {
    let settleTimer = 0;
    const revealImages = () => {
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          document.documentElement.classList.replace('images-loading', 'images-resolving');
          settleTimer = window.setTimeout(() => document.documentElement.classList.remove('images-resolving'), 700);
        });
      });
    };

    if (document.readyState === 'complete') revealImages();
    else window.addEventListener('load', revealImages, { once: true });

    return () => {
      window.removeEventListener('load', revealImages);
      if (settleTimer) window.clearTimeout(settleTimer);
    };
  }, []);

  useEffect(() => {
    const observed = new WeakSet<Element>();
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in-view');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -8% 0px' });

    const observeImages = () => {
      document.querySelectorAll('img[data-reveal]').forEach((image) => {
        if (observed.has(image)) return;
        observed.add(image);
        observer.observe(image);
      });
    };

    observeImages();
    const mutations = new MutationObserver(observeImages);
    mutations.observe(document.getElementById('root')!, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      mutations.disconnect();
    };
  }, []);

  const navigate = (nextView: PortfolioView) => {
    document.documentElement.classList.add('app-ready');
    document.documentElement.classList.remove('initial-shots');
    const order: PortfolioView[] = ['shots', 'projects', 'resume'];
    setNavigationDirection(order.indexOf(nextView) >= order.indexOf(view) ? 'forward' : 'backward');
    const nextPath = nextView === 'resume' ? '/resume' : nextView === 'projects' ? '/projects' : '/';
    const updateView = () => {
      setSelectedProject(null);
      setPreviewOrigin(null);
      setView(nextView);
      setProjectDetail(false);
      if (window.location.pathname !== nextPath) window.history.pushState({ view: nextView }, '', nextPath);
    };
    updateView();
    window.requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'auto' }));
  };

  const openVurtCaseStudy = () => {
    document.documentElement.classList.add('app-ready');
    document.documentElement.classList.remove('initial-shots');
    setNavigationDirection('forward');
    setView('projects');
    setProjectDetail(true);
    window.history.pushState({ view: 'projects', project: 'vurt' }, '', '/projects/vurt');
    window.requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'auto' }));
  };

  const closeVurtCaseStudy = () => {
    document.documentElement.classList.add('app-ready');
    document.documentElement.classList.remove('initial-shots');
    setNavigationDirection('backward');
    setProjectDetail(false);
    setView('projects');
    window.history.pushState({ view: 'projects' }, '', '/projects');
    window.requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'auto' }));
  };

  const visibleProjects = projects.filter((project) => {
    if (shotFilter === 'all') return true;
    if (shotFilter === 'mobile' || shotFilter === 'web') return project.kind === shotFilter;
    if (shotFilter === 'dashboards') return project.kind === 'web';
    return project.motion === 'static';
  });

  const openProject = (project: Project, origin: PreviewOrigin, sourceImage: HTMLImageElement) => {
    const startViewTransition = (document as ViewTransitionDocument).startViewTransition;
    if (!startViewTransition || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setPreviewOrigin(origin);
      setNativePreviewTransition(false);
      setSelectedProject(project);
      return;
    }

    sourceImage.style.viewTransitionName = 'selected-shot';
    const transition = startViewTransition.call(document, () => {
      sourceImage.style.viewTransitionName = '';
      flushSync(() => {
        setPreviewOrigin(null);
        setNativePreviewTransition(true);
        setSelectedProject(project);
      });
    });
    // Keep the shared-origin layout state while the preview is open. Clearing it
    // here would re-enable the modal's normal entrance animation and cause a
    // visible second "switch" immediately after the photo transition settles.
    transition.finished.catch(() => undefined);
  };

  const closeProject = () => {
    if (!selectedProject) return;
    const sourceImage = Array.from(document.querySelectorAll<HTMLImageElement>('.project-card__image')).find((image) => image.getAttribute('src') === selectedProject.image);
    const startViewTransition = (document as ViewTransitionDocument).startViewTransition;
    if (!sourceImage || !startViewTransition || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setSelectedProject(null);
      setPreviewOrigin(null);
      return;
    }

    const transition = startViewTransition.call(document, () => {
      sourceImage.style.viewTransitionName = 'selected-shot';
      flushSync(() => {
        setSelectedProject(null);
        setPreviewOrigin(null);
        setNativePreviewTransition(false);
      });
    });
    transition.finished.catch(() => undefined).finally(() => { sourceImage.style.viewTransitionName = ''; });
  };

  return (
    <>
      <ScrolledHeader active={view} projectDetail={projectDetail} onBack={closeVurtCaseStudy} onNavigate={navigate} />
      <main className={view === 'resume' ? 'resume-main' : view === 'projects' ? (projectDetail ? 'case-study-main' : 'projects-main') : 'shots-main'}>
        {view === 'resume' ? <ResumePage direction={navigationDirection} /> : view === 'projects' ? (projectDetail ? <VurtCaseStudy direction={navigationDirection} /> : <ProjectsLanding onOpenVurt={openVurtCaseStudy} direction={navigationDirection} />) : (
          <div className="content-shell">
            <Profile />
            <section className={`portfolio-bottom portfolio-bottom--${navigationDirection}`}>
              <section className="project-grid" id="projects" aria-label="Selected design shots">
                {visibleProjects.map((project, index) => <ProjectCard key={`${project.image}-${index}`} project={project} onOpen={(origin, image) => openProject(project, origin, image)} />)}
              </section>
            </section>
          </div>
        )}
        <FloatingNavigation active={view} onNavigate={navigate} filter={shotFilter} onFilter={setShotFilter} muted={muted} onMutedChange={setMuted} />
      </main>
      <Footer />
      {selectedProject && <ProjectPreview project={selectedProject} origin={previewOrigin} nativeTransition={nativePreviewTransition} onClose={closeProject} />}
    </>
  );
}
