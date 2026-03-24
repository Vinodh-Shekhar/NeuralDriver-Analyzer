import { Github } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="border-t border-nvidia-border py-12 bg-nvidia-panel/40">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          <div className="space-y-4">
            <h3 className="font-mono text-lg font-bold text-nvidia-green tracking-tight uppercase">FrameBench</h3>
            <p className="font-mono text-[11px] text-nvidia-muted leading-relaxed">
              Professional GPU performance analysis for driver validation and benchmarking teams. Engineered for precision.
            </p>
          </div>

          <div>
            <h4 className="font-mono text-xs font-bold text-nvidia-text mb-4 uppercase tracking-wider">Resources</h4>
            <ul className="space-y-2 font-mono text-[11px] text-nvidia-muted">
              <li><a href="https://github.com/Vinodh-Shekhar/FrameBench-Analyzer/releases" target="_blank" rel="noopener noreferrer" className="hover:text-nvidia-green transition-colors uppercase tracking-tight">Release Notes</a></li>
              <li><a href="https://github.com/Vinodh-Shekhar/FrameBench-Analyzer/blob/main/README.md" target="_blank" rel="noopener noreferrer" className="hover:text-nvidia-green transition-colors uppercase tracking-tight">README</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-mono text-xs font-bold text-nvidia-text mb-4 uppercase tracking-wider">Community</h4>
            <ul className="space-y-2 font-mono text-[11px] text-nvidia-muted">
              <li><a href="https://github.com/Vinodh-Shekhar/FrameBench-Analyzer" target="_blank" rel="noopener noreferrer" className="hover:text-nvidia-green transition-colors uppercase tracking-tight">GitHub</a></li>
              <li><a href="https://github.com/Vinodh-Shekhar/FrameBench-Analyzer/issues" target="_blank" rel="noopener noreferrer" className="hover:text-nvidia-green transition-colors uppercase tracking-tight">Issues</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-mono text-xs font-bold text-nvidia-text mb-4 uppercase tracking-wider">Legal</h4>
            <ul className="space-y-2 font-mono text-[11px] text-nvidia-muted">
              <li><a href="https://github.com/Vinodh-Shekhar/FrameBench-Analyzer/blob/main/LICENSE" target="_blank" rel="noopener noreferrer" className="hover:text-nvidia-green transition-colors uppercase tracking-tight">License</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-nvidia-border pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 font-mono text-[10px] text-nvidia-muted uppercase tracking-widest">
            <p>© 2026 FrameBench Analyzer — Prototype by Vinodh Shekhar and Karan Balaji</p>
            <a href="https://github.com/Vinodh-Shekhar/FrameBench-Analyzer" target="_blank" rel="noopener noreferrer" className="text-nvidia-muted hover:text-nvidia-green transition-colors">
              <Github size={16} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
