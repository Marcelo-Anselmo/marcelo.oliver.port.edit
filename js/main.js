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

function createYouTubeCard(project) {
  const card = document.createElement('div');
  card.className = 'portfolio-item';
  card.dataset.cat = project.category;

  const image = document.createElement('img');
  image.src = `https://img.youtube.com/vi/${project.id}/maxresdefault.jpg`;
  image.alt = project.title;
  image.loading = 'lazy';
  image.onerror = () => {
    image.onerror = null;
    image.src = `https://img.youtube.com/vi/${project.id}/hqdefault.jpg`;
  };

  const overlay = document.createElement('div');
  overlay.className = 'portfolio-overlay';

  const category = document.createElement('div');
  category.className = 'portfolio-cat';
  category.textContent = project.tag;

  const title = document.createElement('div');
  title.className = 'portfolio-title-item';
  title.textContent = project.title;

  const link = document.createElement('a');
  link.className = 'portfolio-play';
  link.href = `https://youtube.com/shorts/${project.id}`;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';

  const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  icon.setAttribute('viewBox', '0 0 24 24');
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', 'M8 5v14l11-7z');
  icon.append(path);
  link.append(icon, document.createTextNode('Assistir'));
  overlay.append(category, title, link);
  card.append(image, overlay);

  return card;
}

function createInstagramCard(project) {
  const card = document.createElement('div');
  card.className = 'portfolio-item instagram';

  const embed = document.createElement('blockquote');
  embed.className = 'instagram-media';
  embed.dataset.instgrmPermalink = `https://www.instagram.com/reel/${project.id}/`;
  embed.dataset.instgrmVersion = '14';
  card.append(embed);

  return card;
}

function render(filter = 'all') {
  const visibleProjects = filter === 'all'
    ? projects
    : projects.filter((project) => project.category === filter);
  const fragment = document.createDocumentFragment();

  visibleProjects.forEach((project) => {
    const card = project.type === 'youtube'
      ? createYouTubeCard(project)
      : createInstagramCard(project);
    fragment.append(card);
  });

  portfolioGrid.replaceChildren(fragment);
  window.instgrm?.Embeds.process();
}

document.querySelectorAll('.filter-tab').forEach((button) => {
  button.addEventListener('click', () => {
    document.querySelector('.filter-tab.active')?.classList.remove('active');
    button.classList.add('active');
    currentFilter = button.dataset.filter;
    render(currentFilter);
  });
});

fetch('data/projects.json')
  .then((response) => {
    if (!response.ok) {
      throw new Error(`Failed to load projects: ${response.status} ${response.statusText}`);
    }
    return response.json();
  })
  .then((data) => {
    projects = data;
    render(currentFilter);
  })
  .catch(console.error);
