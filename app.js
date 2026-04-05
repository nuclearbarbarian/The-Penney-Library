/* ============================================================
   THE PENNEY LIBRARY — Application Logic
   ============================================================ */

(function () {
  'use strict';

  // --- State ---
  let books = [];
  let reflections = {};
  let currentView = 'library';

  // --- Genre Taxonomy ---
  const GENRES = [
    'Fiction', 'Nonfiction', 'Philosophy', 'History', 'Poetry',
    'Graphic Novel', 'Science', 'Political Theory',
    'Religion/Theology', 'Economics', 'Memoir', 'Technical'
  ];

  // --- DOM References ---
  const views = {
    library: document.getElementById('view-library'),
    trends: document.getElementById('view-trends'),
    reflections: document.getElementById('view-reflections'),
  };
  const filterYear = document.getElementById('filter-year');
  const filterGenre = document.getElementById('filter-genre');
  const sortBy = document.getElementById('sort-by');
  const libraryBody = document.getElementById('library-body');
  const bookCount = document.getElementById('book-count');
  const emptyState = document.getElementById('empty-state');
  const reflectionsList = document.getElementById('reflections-list');
  const reflectionsEmpty = document.getElementById('reflections-empty');
  const lastUpdated = document.getElementById('last-updated');

  // --- Navigation ---
  document.querySelectorAll('.nav-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var view = btn.dataset.view;
      switchView(view);
    });
  });

  function switchView(view) {
    currentView = view;
    document.querySelectorAll('.nav-btn').forEach(function (b) {
      b.classList.toggle('active', b.dataset.view === view);
    });
    Object.keys(views).forEach(function (key) {
      views[key].classList.toggle('active', key === view);
    });
  }

  // --- Data Loading ---
  function loadData() {
    Promise.all([
      fetch('data/books.json').then(function (r) { return r.json(); }),
      fetch('data/reflections.json').then(function (r) { return r.json(); })
    ]).then(function (results) {
      books = results[0];
      reflections = results[1];
      init();
    }).catch(function (err) {
      console.error('Failed to load data:', err);
      init();
    });
  }

  function init() {
    populateFilters();
    renderLibrary();
    renderReflections();
    updateFooter();
  }

  // --- Filters ---
  function populateFilters() {
    // Years
    var years = [];
    books.forEach(function (b) {
      if (b.year_read && years.indexOf(b.year_read) === -1) {
        years.push(b.year_read);
      }
    });
    years.sort().reverse();

    filterYear.innerHTML = '<option value="all">All Years</option>';
    years.forEach(function (y) {
      var opt = document.createElement('option');
      opt.value = y;
      opt.textContent = y;
      filterYear.appendChild(opt);
    });

    // Genres
    var genres = [];
    books.forEach(function (b) {
      if (b.genre && genres.indexOf(b.genre) === -1) {
        genres.push(b.genre);
      }
    });
    genres.sort();

    filterGenre.innerHTML = '<option value="all">All Genres</option>';
    genres.forEach(function (g) {
      var opt = document.createElement('option');
      opt.value = g;
      opt.textContent = g;
      filterGenre.appendChild(opt);
    });
  }

  // --- Library Rendering ---
  function getFilteredBooks() {
    var year = filterYear.value;
    var genre = filterGenre.value;
    var sort = sortBy.value;

    var filtered = books.filter(function (b) {
      if (year !== 'all' && String(b.year_read) !== year) return false;
      if (genre !== 'all' && b.genre !== genre) return false;
      return true;
    });

    filtered.sort(function (a, b) {
      switch (sort) {
        case 'date-desc':
          return (b.date_finished || '').localeCompare(a.date_finished || '');
        case 'date-asc':
          return (a.date_finished || '').localeCompare(b.date_finished || '');
        case 'title':
          return (a.title || '').localeCompare(b.title || '');
        case 'author':
          return (a.author || '').localeCompare(b.author || '');
        default:
          return 0;
      }
    });

    return filtered;
  }

  function renderLibrary() {
    var filtered = getFilteredBooks();
    libraryBody.innerHTML = '';

    if (filtered.length === 0) {
      emptyState.style.display = 'block';
      document.querySelector('.library-table').style.display = 'none';
    } else {
      emptyState.style.display = 'none';
      document.querySelector('.library-table').style.display = 'table';

      filtered.forEach(function (book) {
        var tr = document.createElement('tr');
        tr.innerHTML =
          '<td>' + escapeHtml(book.title || '') + '</td>' +
          '<td>' + escapeHtml(book.author || '') + '</td>' +
          '<td><span class="genre-tag">' + escapeHtml(book.genre || '') + '</span></td>' +
          '<td>' + (book.year_read || '') + '</td>' +
          '<td>' + formatDate(book.date_finished) + '</td>';
        libraryBody.appendChild(tr);
      });
    }

    bookCount.textContent = filtered.length;
  }

  // --- Reflections Rendering ---
  function renderReflections() {
    reflectionsList.innerHTML = '';
    var years = Object.keys(reflections).sort().reverse();

    if (years.length === 0) {
      reflectionsEmpty.style.display = 'block';
      return;
    }

    reflectionsEmpty.style.display = 'none';

    years.forEach(function (year) {
      var r = reflections[year];
      var card = document.createElement('div');
      card.className = 'reflection-card';

      var header = '<h2>Reflections on ' + escapeHtml(year) + '</h2>';
      header += '<p class="reflection-date">' + escapeHtml(r.date || '') + '</p>';
      header += '<button class="reflection-toggle">Show full reflection</button>';

      var body = '<div class="reflection-body">';

      // Context
      if (r.context) {
        body += '<div class="reflection-section">';
        body += '<h3>Context</h3>';
        body += '<p>' + escapeHtml(r.context) + '</p>';
        body += '</div>';
      }

      // Experience
      if (r.experience) {
        body += '<div class="reflection-section">';
        body += '<h3>Experience</h3>';
        if (r.experience.goals) {
          body += '<p><span class="label">Goals:</span> ' + escapeHtml(r.experience.goals) + '</p>';
        }
        if (r.experience.standout_moments) {
          body += '<p><span class="label">Standout moments:</span> ' + escapeHtml(r.experience.standout_moments) + '</p>';
        }
        if (r.experience.surprises) {
          body += '<p><span class="label">Surprises:</span> ' + escapeHtml(r.experience.surprises) + '</p>';
        }
        body += '</div>';
      }

      // Reflection
      if (r.reflection) {
        body += '<div class="reflection-section">';
        body += '<h3>Reflection</h3>';
        if (r.reflection.worked_well) {
          body += '<p><span class="label">What worked well:</span> ' + escapeHtml(r.reflection.worked_well) + '</p>';
        }
        if (r.reflection.didnt_work) {
          body += '<p><span class="label">What didn\'t work:</span> ' + escapeHtml(r.reflection.didnt_work) + '</p>';
        }
        if (r.reflection.root_causes) {
          body += '<p><span class="label">Root causes:</span> ' + escapeHtml(r.reflection.root_causes) + '</p>';
        }
        if (r.reflection.tensions) {
          body += '<p><span class="label">Tensions:</span> ' + escapeHtml(r.reflection.tensions) + '</p>';
        }
        body += '</div>';
      }

      // Action items
      if (r.action && r.action.length > 0) {
        body += '<div class="reflection-section">';
        body += '<h3>Action</h3>';
        r.action.forEach(function (item) {
          body += '<div class="action-item">';
          body += '<p class="action-title">' + escapeHtml(item.title || '') + '</p>';
          body += '<p class="action-practice">' + escapeHtml(item.practice || '') + '</p>';
          if (item.why) {
            body += '<p class="action-why">Why: ' + escapeHtml(item.why) + '</p>';
          }
          body += '</div>';
        });
        body += '</div>';
      }

      // Evaluation
      if (r.evaluation) {
        body += '<div class="reflection-section">';
        body += '<h3>Evaluation</h3>';
        body += '<p>' + escapeHtml(r.evaluation) + '</p>';
        body += '</div>';
      }

      body += '</div>';

      card.innerHTML = header + body;

      // Toggle behavior
      var toggle = card.querySelector('.reflection-toggle');
      var bodyEl = card.querySelector('.reflection-body');
      toggle.addEventListener('click', function () {
        var isOpen = bodyEl.classList.toggle('open');
        toggle.textContent = isOpen ? 'Hide full reflection' : 'Show full reflection';
      });

      reflectionsList.appendChild(card);
    });
  }

  // --- Footer ---
  function updateFooter() {
    if (books.length > 0) {
      var dates = books
        .map(function (b) { return b.date_finished; })
        .filter(Boolean)
        .sort();
      var latest = dates[dates.length - 1];
      if (latest) {
        lastUpdated.textContent = 'Last entry: ' + formatDate(latest);
      }
    }
  }

  // --- Utilities ---
  function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function formatDate(dateStr) {
    if (!dateStr) return '';
    var parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    var months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    var monthIndex = parseInt(parts[1], 10) - 1;
    return months[monthIndex] + ' ' + parseInt(parts[2], 10) + ', ' + parts[0];
  }

  // --- Event Listeners ---
  filterYear.addEventListener('change', renderLibrary);
  filterGenre.addEventListener('change', renderLibrary);
  sortBy.addEventListener('change', renderLibrary);

  // --- Init ---
  loadData();

})();
