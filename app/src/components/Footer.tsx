export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <p>
          <strong>FactoryPulse</strong> &mdash; Cable Manufacturing Intelligence &middot;
          Built with{' '}
          <a href="https://pola.rs" target="_blank" rel="noopener noreferrer">Polars</a>
          {' · '}
          <a href="https://nextjs.org" target="_blank" rel="noopener noreferrer">Next.js 15</a>
          {' · '}
          <a href="https://vercel.com" target="_blank" rel="noopener noreferrer">Vercel</a>
          {' \u00b7 '}
          131 machines &middot; 2M+ readings &middot; 1.5s pipeline &copy; {new Date().getFullYear()}
        </p>
      </div>
    </footer>
  )
}
