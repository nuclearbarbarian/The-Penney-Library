/* ============================================================
   THE PENNEY LIBRARY — Application Logic
   ============================================================ */

(function () {
  'use strict';

  // --- State ---
  let books = [];
  let reflections = {};

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
  const libraryTable = document.querySelector('.library-table');
  const bookCount = document.getElementById('book-count');
  const emptyState = document.getElementById('empty-state');
  const reflectionsList = document.getElementById('reflections-list');
  const reflectionsEmpty = document.getElementById('reflections-empty');
  const lastUpdated = document.getElementById('last-updated');
  const trendsEmpty = document.getElementById('trends-empty');
  const trendsContent = document.getElementById('trends-content');

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
  function checkedJson(r) {
    if (!r.ok) throw new Error('HTTP ' + r.status + ' loading ' + r.url);
    return r.json();
  }

  function loadData() {
    Promise.all([
      fetch('data/books.json').then(checkedJson),
      fetch('data/reflections.json').then(checkedJson)
    ]).then(function (results) {
      books = results[0];
      reflections = results[1];
      init();
    }).catch(function (err) {
      console.error('Failed to load data:', err);
      showError('Failed to load reading data. Check the console for details.');
      init();
    });
  }

  function showError(msg) {
    var banner = document.createElement('div');
    banner.className = 'error-banner';
    banner.textContent = msg;
    document.querySelector('.site-nav').insertAdjacentElement('afterend', banner);
  }

  function init() {
    populateFilters();
    renderLibrary();
    renderTrends();
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
      libraryTable.style.display = 'none';
    } else {
      emptyState.style.display = 'none';
      libraryTable.style.display = 'table';

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

  // --- Trends Rendering ---
  var CHART_COLORS = ['#2B4B6F', '#5C5C5C', '#8A8A8A', '#B8B8B8', '#8B2B2B',
    '#3D5C3D', '#C4A035', '#2D2D2D', '#9C9788', '#DCDCDC', '#6B4B3D', '#4B6B5C'];

  function renderTrends() {
    if (books.length === 0) {
      trendsEmpty.style.display = 'block';
      trendsContent.style.display = 'none';
      return;
    }

    trendsEmpty.style.display = 'none';
    trendsContent.style.display = 'block';

    renderBooksPerYear();
    renderGenreByYear();
    renderGenreDistribution();
  }

  function getYears() {
    var yearSet = {};
    books.forEach(function (b) { if (b.year_read) yearSet[b.year_read] = true; });
    return Object.keys(yearSet).map(Number).sort();
  }

  function getGenreCounts() {
    var counts = {};
    books.forEach(function (b) {
      var g = b.genre || 'Unknown';
      counts[g] = (counts[g] || 0) + 1;
    });
    return counts;
  }

  // --- Chart 1: Books Per Year (vertical bar) ---
  function renderBooksPerYear() {
    var container = document.getElementById('chart-books-per-year');
    var years = getYears();
    if (years.length === 0) return;

    var counts = {};
    books.forEach(function (b) {
      var y = b.year_read;
      counts[y] = (counts[y] || 0) + 1;
    });

    var maxCount = 0;
    years.forEach(function (y) { if (counts[y] > maxCount) maxCount = counts[y]; });

    var svgW = 700;
    var svgH = 300;
    var padL = 50;
    var padR = 20;
    var padT = 20;
    var padB = 40;
    var chartW = svgW - padL - padR;
    var chartH = svgH - padT - padB;

    var barW = Math.min(40, (chartW / years.length) * 0.6);
    var gap = (chartW - barW * years.length) / (years.length + 1);

    // Y-axis: round max up to a nice number
    var yMax = Math.ceil(maxCount / 5) * 5;
    if (yMax < 5) yMax = 5;
    var yTicks = 5;
    var yStep = yMax / yTicks;

    var svg = '<svg width="100%" viewBox="0 0 ' + svgW + ' ' + svgH + '" xmlns="http://www.w3.org/2000/svg" style="font-family: \'Source Serif 4\', Georgia, serif;">';

    // Grid lines and Y labels
    for (var i = 0; i <= yTicks; i++) {
      var yVal = yStep * i;
      var yPos = padT + chartH - (yVal / yMax) * chartH;
      svg += '<line x1="' + padL + '" y1="' + yPos + '" x2="' + (svgW - padR) + '" y2="' + yPos + '" stroke="#DCDCDC" stroke-width="0.5"/>';
      svg += '<text x="' + (padL - 8) + '" y="' + (yPos + 4) + '" text-anchor="end" font-size="9" font-family="\'IBM Plex Mono\', monospace" fill="#5C5C5C">' + yVal + '</text>';
    }

    // Axis lines
    svg += '<line x1="' + padL + '" y1="' + padT + '" x2="' + padL + '" y2="' + (padT + chartH) + '" stroke="#1A1A1A" stroke-width="0.5"/>';
    svg += '<line x1="' + padL + '" y1="' + (padT + chartH) + '" x2="' + (svgW - padR) + '" y2="' + (padT + chartH) + '" stroke="#1A1A1A" stroke-width="0.5"/>';

    // Bars
    years.forEach(function (year, idx) {
      var count = counts[year] || 0;
      var barH = (count / yMax) * chartH;
      var x = padL + gap + idx * (barW + gap);
      var y = padT + chartH - barH;

      svg += '<rect x="' + x + '" y="' + y + '" width="' + barW + '" height="' + barH + '" fill="#2B4B6F" stroke="#1A1A1A" stroke-width="0.5"/>';

      // Value label on top
      svg += '<text x="' + (x + barW / 2) + '" y="' + (y - 6) + '" text-anchor="middle" font-size="10" font-family="\'IBM Plex Mono\', monospace" fill="#1A1A1A">' + count + '</text>';

      // Year label
      svg += '<text x="' + (x + barW / 2) + '" y="' + (padT + chartH + 20) + '" text-anchor="middle" font-size="10" font-family="\'IBM Plex Mono\', monospace" fill="#1A1A1A">' + year + '</text>';
    });

    svg += '</svg>';
    container.innerHTML = svg;
  }

  // --- Chart 2: Genre Breakdown by Year (stacked bar) ---
  function renderGenreByYear() {
    var container = document.getElementById('chart-genre-by-year');
    var years = getYears();
    if (years.length === 0) return;

    var genreTotals = getGenreCounts();
    var genres = Object.keys(genreTotals).sort(function (a, b) {
      return genreTotals[b] - genreTotals[a];
    });

    // Count per year per genre
    var data = {};
    years.forEach(function (y) { data[y] = {}; });
    books.forEach(function (b) {
      var y = b.year_read;
      var g = b.genre || 'Unknown';
      if (!data[y]) data[y] = {};
      data[y][g] = (data[y][g] || 0) + 1;
    });

    var maxStack = 0;
    years.forEach(function (y) {
      var total = 0;
      genres.forEach(function (g) { total += (data[y][g] || 0); });
      if (total > maxStack) maxStack = total;
    });

    var svgW = 700;
    var svgH = 340;
    var padL = 50;
    var padR = 180;
    var padT = 20;
    var padB = 40;
    var chartW = svgW - padL - padR;
    var chartH = svgH - padT - padB;

    var barW = Math.min(40, (chartW / years.length) * 0.6);
    var gap = (chartW - barW * years.length) / (years.length + 1);

    var yMax = Math.ceil(maxStack / 5) * 5;
    if (yMax < 5) yMax = 5;
    var yTicks = 5;
    var yStep = yMax / yTicks;

    var svg = '<svg width="100%" viewBox="0 0 ' + svgW + ' ' + svgH + '" xmlns="http://www.w3.org/2000/svg" style="font-family: \'Source Serif 4\', Georgia, serif;">';

    // Grid
    for (var i = 0; i <= yTicks; i++) {
      var yVal = yStep * i;
      var yPos = padT + chartH - (yVal / yMax) * chartH;
      svg += '<line x1="' + padL + '" y1="' + yPos + '" x2="' + (padL + chartW) + '" y2="' + yPos + '" stroke="#DCDCDC" stroke-width="0.5"/>';
      svg += '<text x="' + (padL - 8) + '" y="' + (yPos + 4) + '" text-anchor="end" font-size="9" font-family="\'IBM Plex Mono\', monospace" fill="#5C5C5C">' + yVal + '</text>';
    }

    // Axes
    svg += '<line x1="' + padL + '" y1="' + padT + '" x2="' + padL + '" y2="' + (padT + chartH) + '" stroke="#1A1A1A" stroke-width="0.5"/>';
    svg += '<line x1="' + padL + '" y1="' + (padT + chartH) + '" x2="' + (padL + chartW) + '" y2="' + (padT + chartH) + '" stroke="#1A1A1A" stroke-width="0.5"/>';

    // Stacked bars
    years.forEach(function (year, idx) {
      var x = padL + gap + idx * (barW + gap);
      var stackY = padT + chartH;

      genres.forEach(function (genre, gi) {
        var count = data[year][genre] || 0;
        if (count === 0) return;
        var segH = (count / yMax) * chartH;
        stackY -= segH;
        svg += '<rect x="' + x + '" y="' + stackY + '" width="' + barW + '" height="' + segH + '" fill="' + CHART_COLORS[gi % CHART_COLORS.length] + '" stroke="#1A1A1A" stroke-width="0.5"/>';
      });

      // Year label
      svg += '<text x="' + (x + barW / 2) + '" y="' + (padT + chartH + 20) + '" text-anchor="middle" font-size="10" font-family="\'IBM Plex Mono\', monospace" fill="#1A1A1A">' + year + '</text>';
    });

    // Legend
    var legendX = padL + chartW + 20;
    genres.forEach(function (genre, gi) {
      var ly = padT + gi * 20;
      svg += '<rect x="' + legendX + '" y="' + ly + '" width="12" height="12" fill="' + CHART_COLORS[gi % CHART_COLORS.length] + '" stroke="#1A1A1A" stroke-width="0.5"/>';
      svg += '<text x="' + (legendX + 18) + '" y="' + (ly + 10) + '" font-size="9" fill="#1A1A1A">' + escapeHtml(genre) + '</text>';
    });

    svg += '</svg>';
    container.innerHTML = svg;
  }

  // --- Chart 3: Overall Genre Distribution (horizontal bar) ---
  function renderGenreDistribution() {
    var container = document.getElementById('chart-genre-distribution');
    var genreCounts = getGenreCounts();

    var genres = Object.keys(genreCounts).sort(function (a, b) {
      return genreCounts[b] - genreCounts[a];
    });

    if (genres.length === 0) return;

    var maxCount = 0;
    genres.forEach(function (g) { if (genreCounts[g] > maxCount) maxCount = genreCounts[g]; });

    var svgW = 700;
    var barH = 22;
    var gap = 6;
    var padL = 140;
    var padR = 50;
    var padT = 10;
    var chartW = svgW - padL - padR;
    var svgH = padT + genres.length * (barH + gap);

    var xMax = Math.ceil(maxCount / 5) * 5;
    if (xMax < 5) xMax = 5;

    var svg = '<svg width="100%" viewBox="0 0 ' + svgW + ' ' + svgH + '" xmlns="http://www.w3.org/2000/svg" style="font-family: \'Source Serif 4\', Georgia, serif;">';

    genres.forEach(function (genre, idx) {
      var count = genreCounts[genre];
      var y = padT + idx * (barH + gap);
      var w = (count / xMax) * chartW;

      // Genre label
      svg += '<text x="' + (padL - 8) + '" y="' + (y + barH / 2 + 4) + '" text-anchor="end" font-size="10" fill="#1A1A1A">' + escapeHtml(genre) + '</text>';

      // Bar
      svg += '<rect x="' + padL + '" y="' + y + '" width="' + w + '" height="' + barH + '" fill="' + CHART_COLORS[idx % CHART_COLORS.length] + '" stroke="#1A1A1A" stroke-width="0.5"/>';

      // Count label
      svg += '<text x="' + (padL + w + 8) + '" y="' + (y + barH / 2 + 4) + '" font-size="10" font-family="\'IBM Plex Mono\', monospace" fill="#1A1A1A">' + count + '</text>';
    });

    svg += '</svg>';
    container.innerHTML = svg;
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
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
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
    if (monthIndex < 0 || monthIndex > 11) return dateStr;
    return months[monthIndex] + ' ' + parseInt(parts[2], 10) + ', ' + parts[0];
  }

  // --- Event Listeners ---
  filterYear.addEventListener('change', renderLibrary);
  filterGenre.addEventListener('change', renderLibrary);
  sortBy.addEventListener('change', renderLibrary);

  // --- Init ---
  loadData();

})();
