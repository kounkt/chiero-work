(() => {
  const header = document.querySelector('#header');
  if (header && 'ResizeObserver' in window) {
    new ResizeObserver(() => document.documentElement.style.setProperty('--header-offset', `${header.offsetHeight + 18}px`)).observe(header);
  }
  const menu = document.querySelector('.chiero-mobile-menu');
  menu?.querySelectorAll('a').forEach(link => link.addEventListener('click', () => menu.open = false));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menu?.open) { menu.open = false; menu.querySelector('summary').focus(); }
  });
  document.addEventListener('click', event => { if (menu?.open && !menu.contains(event.target)) menu.open = false; });
  const media = matchMedia('(prefers-reduced-motion: reduce)');
  const toggle = document.querySelector('#motion-toggle');
  let paused = media.matches;
  const sync = () => {
    document.documentElement.classList.toggle('motion-paused', paused);
    if (toggle) { toggle.hidden = false; toggle.setAttribute('aria-pressed', String(paused)); toggle.textContent = paused ? '動きを再開する' : '動きを止める'; }
  };
  toggle?.addEventListener('click', () => { paused = !paused; sync(); });
  media.addEventListener('change', event => { paused = event.matches; sync(); });
  sync();

  if ('IntersectionObserver' in window) {
    const counterFrames = new Map();
    const count = el => {
      const target = Number(el.dataset.count);
      if (paused || !Number.isFinite(target)) return;
      const start = performance.now();
      const tick = now => {
        if (paused || document.hidden) { el.textContent = target.toLocaleString('en-US'); counterFrames.delete(el); return; }
        const progress = Math.min((now - start) / 1150, 1);
        el.textContent = Math.round(target * (1 - Math.pow(1 - progress, 3))).toLocaleString('en-US');
        if (progress < 1) counterFrames.set(el, requestAnimationFrame(tick));
        else counterFrames.delete(el);
      };
      counterFrames.set(el, requestAnimationFrame(tick));
    };
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.remove('is-pending');
      entry.target.querySelectorAll('[data-count]').forEach(count);
      observer.unobserve(entry.target);
    }), { threshold: 0.1 });
    document.querySelectorAll('.reveal').forEach(el => {
      if (el.getBoundingClientRect().top > innerHeight && !paused) el.classList.add('is-pending');
      observer.observe(el);
    });
    const finish = () => {
      if (!paused) return;
      document.querySelectorAll('.is-pending').forEach(el => el.classList.remove('is-pending'));
      counterFrames.forEach((frame, el) => { cancelAnimationFrame(frame); el.textContent = Number(el.dataset.count).toLocaleString('en-US'); });
      counterFrames.clear();
    };
    toggle?.addEventListener('click', finish);
    media.addEventListener('change', finish);
  }
  document.addEventListener('visibilitychange', () => document.documentElement.classList.toggle('page-inactive', document.hidden));

  const sticky = document.querySelector('#mobile-sticky');
  const hero = document.querySelector('.hero');
  const consult = document.querySelector('#consultation');
  if (sticky && hero && consult && 'IntersectionObserver' in window) {
    let heroVisible = true, consultationVisible = false;
    const updateSticky = () => sticky.hidden = heroVisible || consultationVisible || consult.getBoundingClientRect().bottom < 0;
    new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.target === hero) heroVisible = entry.isIntersecting;
        if (entry.target === consult) consultationVisible = entry.isIntersecting;
      });
      updateSticky();
    }, { rootMargin: '-80px 0px 0px 0px', threshold: 0 }).observe(hero);
    new IntersectionObserver(entries => { consultationVisible = entries[0].isIntersecting; updateSticky(); }, { threshold: 0 }).observe(consult);
  }

  const revenueFields = ['revenue-monthly', 'revenue-growth', 'revenue-margin'].map(id => document.getElementById(id));
  if (revenueFields.every(Boolean)) {
    revenueFields[0].closest('fieldset').hidden = false;
    const format = new Intl.NumberFormat('ja-JP', { maximumFractionDigits: 2 });
    const updateRevenue = () => {
      const valid = revenueFields.map(input => Number.isFinite(input.valueAsNumber) && input.validity.valid);
      revenueFields.forEach((input, i) => input.setAttribute('aria-invalid', String(!valid[i])));
      const error = document.querySelector('#revenue-input-error');
      if (!valid.every(Boolean)) {
        error.textContent = '月商は0〜100,000万円、改善率・粗利率は0〜100％で入力してください。';
        ['revenue-year-value', 'profit-year-value'].forEach(id => document.getElementById(id).textContent = '—');
        document.querySelector('#revenue-formula').textContent = '前提を入力すると、12ヶ月分の売上・粗利機会を計算します。';
        document.querySelector('#revenue-scenario').textContent = '仮定する月商・売上改善率・粗利率を入力してください。';
        return;
      }
      error.textContent = '';
      const [monthly, growth, margin] = revenueFields.map(input => input.valueAsNumber);
      const revenue = monthly * (growth / 100) * 12;
      const profit = revenue * (margin / 100);
      document.querySelector('#revenue-year-value').textContent = format.format(revenue);
      document.querySelector('#profit-year-value').textContent = format.format(profit);
      document.querySelector('#revenue-scenario').textContent = `たとえば、月商${format.format(monthly)}万円の事業で、売上を${format.format(growth)}％伸ばせると仮定した場合。`;
      document.querySelector('#revenue-formula').textContent = `月商${format.format(monthly)}万円 × 売上改善${format.format(growth)}％ × 12ヶ月 ＝ 年間${format.format(revenue)}万円の売上機会。粗利率${format.format(margin)}％なら、粗利機会は${format.format(profit)}万円。`;
    };
    revenueFields.forEach(input => input.addEventListener('input', updateRevenue));
    updateRevenue();
  }

  const costHours = document.querySelector('#cost-hours');
  const costRate = document.querySelector('#cost-rate');
  if (costHours && costRate) {
    costHours.closest('fieldset').hidden = false;
    const amount = new Intl.NumberFormat('ja-JP', { maximumFractionDigits: 2 });
    const outputs = ['money-six-value', 'money-year-value', 'hours-six-value', 'hours-year-value'];
    const updateCost = () => {
      const hours = costHours.valueAsNumber, rate = costRate.valueAsNumber;
      const validHours = Number.isFinite(hours) && costHours.validity.valid;
      const validRate = Number.isFinite(rate) && costRate.validity.valid;
      costHours.setAttribute('aria-invalid', String(!validHours));
      costRate.setAttribute('aria-invalid', String(!validRate));
      const error = document.querySelector('#cost-input-error');
      if (!validHours || !validRate) {
        error.textContent = '時間は0〜8、時間単価は0〜100,000の範囲で入力してください。';
        outputs.forEach(id => document.getElementById(id).textContent = '—');
        document.querySelector('#cost-formula').textContent = '前提を入力すると、月20日稼働で再計算します。';
        return;
      }
      error.textContent = '';
      const sixHours = hours * 20 * 6;
      const sixYen = Math.round(sixHours * rate);
      [sixYen / 10000, Math.round(sixHours * 2 * rate) / 10000, sixHours, sixHours * 2].forEach((v, i) => document.getElementById(outputs[i]).textContent = amount.format(v));
      document.querySelector('#cost-formula').textContent = `${amount.format(hours)}時間 × 月20日 × 6ヶ月 × ${amount.format(rate)}円 ＝ ${amount.format(sixYen)}円相当`;
    };
    [costHours, costRate].forEach(input => input.addEventListener('input', updateCost));
    updateCost();
  }

  const copyButton = document.querySelector('#copy-brief');
  const status = document.querySelector('#copy-status');
  if (copyButton && status && navigator.clipboard?.writeText) {
    copyButton.hidden = false;
    copyButton.addEventListener('click', async () => {
      try {
        const response = await fetch('/assets/advisory-20260909/advisory-brief.txt');
        if (!response.ok) throw new Error('read failed');
        await navigator.clipboard.writeText(await response.text());
        status.textContent = 'コピーしました。普段お使いのAIに貼り付けてください。';
      } catch {
        status.textContent = 'コピーできませんでした。「テキストを開く」からコピーしてください。';
      }
    });
  }
})();
