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

  const tiktokId = url.match(/tiktok\.com\/@[\w.-]+\/video\/(\d+)/i)?.[1];
  if (tiktokId) return { type: 'tiktok', id: tiktokId };

  const youtubeId = url.match(/(?:shorts\/|youtu\.be\/|v=|embed\/)([\w-]{11})/i)?.[1];
  if (youtubeId) return { type: 'youtube', id: youtubeId };

  if (/\.(mp4|webm|mov)(\?.*)?$/i.test(url)) {
    return { type: 'file', id: url };
  }

  return null;
}

function cloudinary(url, transform) {
  const uploadPath = '/upload/';
  const uploadIndex = url.indexOf(uploadPath);
  if (uploadIndex === -1) return url;

  const prefix = url.slice(0, uploadIndex + uploadPath.length);
  const path = url.slice(uploadIndex + uploadPath.length).split('/');

  while (path.length && /^(?:c_|w_|h_|ar_|q_|f_|so_|g_|e_|dpr_|r_|b_|fl_|t_)/.test(path[0])) {
    path.shift();
  }

  return `${prefix}${transform}/${path.join('/')}`;
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

  if (['youtube', 'instagram', 'tiktok'].includes(info.type)) {
    const platform = {
      youtube: 'YouTube',
      instagram: 'Instagram',
      tiktok: 'TikTok',
    }[info.type];
    const thumbnail = info.type === 'youtube'
      ? `https://i.ytimg.com/vi/${esc(info.id)}/hqdefault.jpg`
      : project.thumbnail
        ? esc(project.thumbnail)
        : '';
    const media = thumbnail
      ? `<img src="${thumbnail}" alt="${title}" loading="lazy">`
      : `<div class="external-placeholder">${platform}</div>`;

    return `
      <a class="portfolio-item external" data-type="${info.type}" data-id="${esc(info.id)}"
         href="${esc(project.url || '')}" target="_blank" rel="noopener noreferrer" data-cat="${category}">
        ${media}
        <div class="portfolio-overlay">
          <div class="portfolio-cat">${tag}</div>
          <div class="portfolio-title-item">${title}</div>
        </div>
        <span class="platform-badge">${platform}</span>
      </a>`;
  }

  if (info.type === 'file') {
    const video = cloudinary(info.id, 'q_auto');
    const poster = cloudinary(info.id, 'so_0,q_auto,f_jpg')
      .replace(/\.(mp4|webm|mov)(?=\?|$)/i, '.jpg');
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

const youtubePreviewTimers = new WeakMap();

portfolioGrid.addEventListener('mouseover', (event) => {
  if (!(event.target instanceof Element)) return;
  const item = event.target.closest('.external[data-type="youtube"]');
  if (!item || !window.matchMedia('(hover: hover)').matches) return;
  if (event.relatedTarget instanceof Node && item.contains(event.relatedTarget)) return;

  const timer = window.setTimeout(() => {
    if (!item.isConnected || !item.matches(':hover')) return;

    const id = esc(item.dataset.id || '');
    const preview = document.createElement('iframe');
    preview.className = 'yt-preview';
    preview.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&mute=1&controls=0&loop=1&playlist=${id}&playsinline=1&modestbranding=1`;
    preview.allow = 'autoplay; encrypted-media';
    preview.tabIndex = -1;
    item.append(preview);
  }, 300);

  youtubePreviewTimers.set(item, timer);
});

portfolioGrid.addEventListener('mouseout', (event) => {
  if (!(event.target instanceof Element)) return;
  const item = event.target.closest('.external[data-type="youtube"]');
  if (!item || (event.relatedTarget instanceof Node && item.contains(event.relatedTarget))) return;

  window.clearTimeout(youtubePreviewTimers.get(item));
  youtubePreviewTimers.delete(item);
  item.querySelector('.yt-preview')?.remove();
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
