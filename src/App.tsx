import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
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

const viewFromPath = (): PortfolioView => window.location.pathname === '/resume' ? 'resume' : 'shots';

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
              <button className="preview__carousel-button" onClick={() => changeSlide(-1)} aria-label="Previous slide"><span className="carousel-caret" aria-hidden="true">‹</span></button>
              <span className="preview__dots" aria-label="Carousel slides">{carouselProjects.map((item, dot) => <button className={`preview__carousel-dot${dot === carouselIndex ? ' is-active' : ''}`} onClick={() => setCarouselIndex(dot)} aria-label={`Go to slide ${dot + 1}`} key={`${item.image}-${dot}`} />)}</span>
              <button className="preview__carousel-button" onClick={() => changeSlide(1)} aria-label="Next slide"><span className="carousel-caret" aria-hidden="true">›</span></button>
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

function Profile() {
  return (
    <header className="profile">
      <div className="profile__heading">
        <img className="profile__portrait" src="/assets/portrait.png" alt="Mofifoluwa Olawuyi" data-reveal />
        <div>
          <h1>Mofifoluwa.</h1>
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
    ['Languages', ['English (Native)', 'Spanish (Basic)']],
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
        <a className="resume-education" href="https://run.edu.ng" target="_blank" rel="noreferrer">
          <span>Bsc. Computer Science</span><img src="/assets/icon-external.svg" alt="" />
        </a>
        <p>Redeemer’s University, Nigeria</p>
      </section>
      <div className="resume-download">
        <button aria-label="Download résumé" onClick={() => window.print()}><img src="/assets/icon-download.svg" alt="" /></button>
        <button onClick={() => window.print()}><img src="/assets/icon-download.svg" alt="" />DOWNLOAD</button>
      </div>
    </aside>
  );
}

function ResumePage() {
  return (
    <div className="resume-shell">
      <Profile />
      <div className="resume-rule" />
      <div className="resume-layout">
        <ResumeAside />
        <section className="resume-experience" aria-label="Work experience">
          {experiences.map((experience) => (
            <article className="experience-card" key={`${experience.company}-${experience.period}`} tabIndex={0}>
              <div className="experience-card__heading">
                <div>{experience.website ? <a className="experience-card__company" href={experience.website} target="_blank" rel="noreferrer">{experience.company}</a> : <strong>{experience.company}</strong>}<span>, {experience.location}</span></div>
                <time>{experience.period}</time>
              </div>
              <p className="experience-card__role">{experience.role}</p>
              {experience.description && <p className="experience-card__description">{experience.description}</p>}
              {experience.results && <div className="experience-card__results"><strong>The result?</strong><ul>{experience.results.map((result) => <li key={result}>{result}</li>)}</ul></div>}
            </article>
          ))}
        </section>
      </div>
    </div>
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

function ScrolledHeader({ active }: { active: PortfolioView }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const update = () => setVisible(window.scrollY > 360);
    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, []);

  return (
    <div className={`scrolled-header${visible ? ' is-visible' : ''}`} aria-hidden={!visible}>
      <div className="scrolled-header__content">
        <img src="/assets/portrait.png" alt="" />
        <span>Mofifoluwa</span><span className="scrolled-header__muted">/</span>
        <span className="scrolled-header__muted">{active === 'resume' ? 'Résumé' : active === 'projects' ? 'Projects' : 'Shots'}</span>
        <span className="scrolled-header__muted">·</span>
        <a href={bookingLink} onClick={(event) => event.preventDefault()} data-cal-namespace="30min" data-cal-link="mofifoluwa-olawuyi-74cy24/30min" data-cal-config='{"layout":"month_view","useSlotsViewOnSmallScreen":"true","theme":"light"}'>Book a call</a>
      </div>
    </div>
  );
}

function FloatingNavigation({ active, onNavigate, filter, onFilter, muted, onMutedChange }: { active: PortfolioView; onNavigate: (view: PortfolioView) => void; filter: ShotFilter; onFilter: (filter: ShotFilter) => void; muted: boolean; onMutedChange: (muted: boolean) => void }) {
  const [socialsOpen, setSocialsOpen] = useState(false);
  const [shotsOpen, setShotsOpen] = useState(false);
  const [comingSoon, setComingSoon] = useState(false);
  const [shotsHoverIndex, setShotsHoverIndex] = useState<number | null>(null);
  const [linksHoverIndex, setLinksHoverIndex] = useState<number | null>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const toastTimerRef = useRef(0);

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

  useEffect(() => () => {
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
  }, []);

  const filterItems: Array<[ShotFilter, string]> = [['others', 'Others'], ['web', 'Websites'], ['dashboards', 'Dashboards'], ['mobile', 'Mobile apps'], ['all', 'All shots']];
  const popupSocialLinks = socialLinks.slice().reverse();

  return (
    <div className="floating-nav" ref={navRef}>
      {comingSoon && <div className="floating-nav__toast" role="status">Projects coming soon</div>}
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
                  setComingSoon(false);
                  window.requestAnimationFrame(() => setComingSoon(true));
                  if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
                  toastTimerRef.current = window.setTimeout(() => setComingSoon(false), 2200);
                  setShotsOpen(false);
                  setSocialsOpen(false);
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
              {tab === 'shots' && active === 'shots' && <img className="shots-toggle__icon" src="/assets/nav-active-icon.svg" alt="" />}
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
  const [shotFilter, setShotFilter] = useState<ShotFilter>('all');
  const [muted, setMuted] = useState(() => window.localStorage.getItem('portfolio-sounds-muted') === 'true');

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
    setSelectedProject(null);
    setPreviewOrigin(null);
    setView(nextView);
    const nextPath = nextView === 'resume' ? '/resume' : '/';
    if (window.location.pathname !== nextPath) window.history.pushState({ view: nextView }, '', nextPath);
    window.requestAnimationFrame(() => {
      if (nextView === 'projects') document.getElementById('projects')?.scrollIntoView({ behavior: 'smooth' });
      else window.scrollTo({ top: 0, behavior: 'smooth' });
    });
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
      <ScrolledHeader active={view} />
      <main className={view === 'resume' ? 'resume-main' : 'shots-main'}>
        {view === 'resume' ? <ResumePage /> : (
          <div className="content-shell">
            <Profile />
            <section className="project-grid" id="projects" aria-label="Selected design shots">
              {visibleProjects.map((project, index) => <ProjectCard key={`${project.image}-${index}`} project={project} onOpen={(origin, image) => openProject(project, origin, image)} />)}
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
