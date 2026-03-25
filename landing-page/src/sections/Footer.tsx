import { Github } from 'lucide-react'

const GITHUB_URL = 'https://github.com/Vinodh-Shekhar/FrameBench-Analyzer'

export default function Footer() {
  return (
    <footer className="border-t border-nvidia-border py-12 bg-nvidia-panel-light/30">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-2 h-2 rounded-full bg-nvidia-green flex-shrink-0"></span>
              <span className="font-mono font-bold text-nvidia-text">
                Frame<span className="text-nvidia-green">Bench</span> Analyzer
              </span>
            </div>
            <p className="text-nvidia-muted font-mono text-sm leading-relaxed max-w-sm">
              Professional GPU performance analysis for driver validation and benchmarking teams. Free, offline, and Rust-powered.
            </p>
          </div>

          {/* Resources */}
          <div>
            <h4 className="font-mono font-bold mb-4 text-nvidia-text text-xs uppercase tracking-wider">
              Resources
            </h4>
            <ul className="space-y-2 text-sm text-nvidia-muted font-mono">
              <li>
                <a
                  href={`${GITHUB_URL}/releases`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-nvidia-green transition-colors"
                >
                  Release Notes
                </a>
              </li>
              <li>
                <a
                  href={`${GITHUB_URL}#readme`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-nvidia-green transition-colors"
                >
                  README
                </a>
              </li>
            </ul>
          </div>

          {/* Community + Legal */}
          <div className="space-y-8">
            <div>
              <h4 className="font-mono font-bold mb-4 text-nvidia-text text-xs uppercase tracking-wider">
                Community
              </h4>
              <ul className="space-y-2 text-sm text-nvidia-muted font-mono">
                <li>
                  <a
                    href={GITHUB_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-nvidia-green transition-colors"
                  >
                    GitHub
                  </a>
                </li>
                <li>
                  <a
                    href={`${GITHUB_URL}/issues`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-nvidia-green transition-colors"
                  >
                    Issues
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-mono font-bold mb-4 text-nvidia-text text-xs uppercase tracking-wider">
                Legal
              </h4>
              <ul className="space-y-2 text-sm text-nvidia-muted font-mono">
                <li>
                  <a
                    href={`${GITHUB_URL}/blob/main/LICENSE`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-nvidia-green transition-colors"
                  >
                    License
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="border-t border-nvidia-border pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-nvidia-muted font-mono text-sm">
              © 2026 FrameBench Analyzer. All rights reserved.
            </p>
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-nvidia-muted hover:text-nvidia-green transition-colors"
              aria-label="GitHub"
            >
              <Github size={20} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
