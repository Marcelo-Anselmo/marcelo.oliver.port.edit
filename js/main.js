const cursor = document.getElementById('cursor');
const ring = document.getElementById('cursorRing');
let mx = 0;
let my = 0;
let rx = 0;
let ry = 0;

document.addEventListener('mousemove', (event) => {
  mx = event.clientX;
  my = event.clientY;
});

document.addEventListener('mouseover', (event) => {
  if (event.target instanceof Element) {
    document.body.classList.toggle('cursor-hover', Boolean(event.target.closest('a, button')));
  }
});

function animCursor() {
  cursor.style.left = `${mx}px`;
  cursor.style.top = `${my}px`;
  rx += (mx - rx) * 0.12;
  ry += (my - ry) * 0.12;
  ring.style.left = `${rx}px`;
  ring.style.top = `${ry}px`;
  requestAnimationFrame(animCursor);
}

animCursor();

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry, index) => {
    if (entry.isIntersecting) {
      setTimeout(() => entry.target.classList.add('visible'), index * 100);
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.reveal').forEach((element) => observer.observe(element));

window.addEventListener('load', () => {
  document.querySelectorAll('#hero .reveal').forEach((element, index) => {
    setTimeout(() => element.classList.add('visible'), index * 200 + 300);
  });
});

const portfolioGrid = document.getElementById('portfolioGrid');
let projects = [];
let currentFilter = 'all';

function parseUrl(url) {
  const instagramId = url.match(/instagram\.com\/(?:reel|p)\/([\w-]+)/i)?.[1];
  if (instagramId) return { type: 'instagram', id: instagramId };

  const youtubeId = url.match(/(?:shorts\/|youtu\.be\/|v=|embed\/)([\w-]{11})/i)?.[1];
  if (youtubeId) return { type: 'youtube', id: youtubeId };

  if (/\.(mp4|webm|mov)(\?.*)?$/i.test(url)) {
    return { type: 'file', id: url };
  }

  return null;
}

function cloudinary(url, transform) {
  return url.includes('/upload/')
    ? url.replace('/upload/', `/upload/${transform}/`)
    : url;
}

function esc(value = '') {
  return String(value).replace(/[&<>"]/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
  })[character]);
}

function card(project) {
  const info = project.url ? parseUrl(project.url) : { type: project.type, id: project.id };
  if (!info) return '';

  const tag = esc(project.tag || '');
  const title = esc(project.title || '');
  const category = esc(project.category || '');

  if (info.type === 'youtube') {
    return `
      <div class="portfolio-item" data-cat="${category}">
        <img src="https://img.youtube.com/vi/${esc(info.id)}/maxresdefault.jpg" alt="${title}" loading="lazy" data-fallback="https://img.youtube.com/vi/${esc(info.id)}/hqdefault.jpg">
        <div class="portfolio-overlay">
          <div class="portfolio-cat">${tag}</div>
          <div class="portfolio-title-item">${title}</div>
          <a href="https://youtube.com/shorts/${esc(info.id)}" target="_blank" rel="noopener noreferrer" class="portfolio-play">
            <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
            Assistir
          </a>
        </div>
      </div>`;
  }

  if (info.type === 'instagram') {
    return `
      <div class="portfolio-item instagram" data-cat="${category}">
        <blockquote class="instagram-media" data-instgrm-permalink="https://www.instagram.com/reel/${esc(info.id)}/" data-instgrm-version="14"></blockquote>
      </div>`;
  }

  if (info.type === 'file') {
    const video = cloudinary(info.id, 'q_auto');
    const poster = cloudinary(info.id, 'so_0,q_auto,f_jpg')
      .replace(/\.(mp4|webm|mov)(\?.*)?$/i, '.jpg');
    return `
      <div class="portfolio-item video" data-cat="${category}">
        <video src="${esc(video)}" poster="${esc(poster)}" muted loop playsinline preload="none"></video>
        <div class="portfolio-overlay">
          <div class="portfolio-cat">${tag}</div>
          <div class="portfolio-title-item">${title}</div>
        </div>
        <span class="video-sound" aria-hidden="true">🔇</span>
      </div>`;
  }

  return '';
}

function render(filter = 'all') {
  const visibleProjects = filter === 'all'
    ? projects
    : projects.filter((project) => project.category === filter);
  portfolioGrid.innerHTML = visibleProjects.map(card).join('');
  window.instgrm?.Embeds.process();
}

portfolioGrid.addEventListener('error', (event) => {
  const media = event.target;
  if (media instanceof HTMLImageElement && media.dataset.fallback) {
    media.src = media.dataset.fallback;
    delete media.dataset.fallback;
  } else if (media instanceof HTMLVideoElement) {
    console.error('Erro ao carregar vídeo:', media.currentSrc || media.src);
  }
}, true);

portfolioGrid.addEventListener('mouseover', (event) => {
  if (!(event.target instanceof Element)) return;
  const item = event.target.closest('.portfolio-item.video');
  item?.querySelector('video')?.play().catch((error) => {
    if (error.name !== 'AbortError') console.error('Erro ao reproduzir vídeo:', error);
  });
});

portfolioGrid.addEventListener('mouseout', (event) => {
  if (!(event.target instanceof Element)) return;
  const item = event.target.closest('.portfolio-item.video');
  if (!item || (event.relatedTarget instanceof Node && item.contains(event.relatedTarget))) return;
  item.querySelector('video')?.pause();
});

portfolioGrid.addEventListener('click', (event) => {
  if (!(event.target instanceof Element)) return;
  const item = event.target.closest('.portfolio-item.video');
  if (!item) return;

  const video = item.querySelector('video');
  if (video.paused) {
    video.play().catch((error) => {
      if (error.name !== 'AbortError') console.error('Erro ao reproduzir vídeo:', error);
    });
  }

  video.muted = !video.muted;
  item.querySelector('.video-sound').textContent = video.muted ? '🔇' : '🔊';
});

document.querySelectorAll('.filter-tab').forEach((button) => {
  button.addEventListener('click', () => {
    document.querySelector('.filter-tab.active')?.classList.remove('active');
    button.classList.add('active');
    currentFilter = button.dataset.filter;
    render(currentFilter);
  });
});

fetch('data/projects.json', { cache: 'no-store' })
  .then((response) => response.json())
  .then((data) => {
    projects = data.projects || data;
    render(currentFilter);
  })
  .catch((error) => console.error('Erro ao carregar projetos:', error));
