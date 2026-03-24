import Button from './Button';
import { Github } from 'lucide-react';

export default function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-nvidia-border bg-nvidia-bg/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-3">
            <img src="favicon.ico" alt="FrameBench Logo" className="w-8 h-8 rounded-md" />
            <h1 className="font-mono text-xl font-bold tracking-tight text-nvidia-text">
              FrameBench <span className="text-nvidia-green uppercase">Analyzer</span>
            </h1>
          </div>
          
          <nav className="hidden md:flex items-center gap-8 font-mono text-xs uppercase tracking-widest text-nvidia-muted">
            <a href="#features" className="hover:text-nvidia-green transition-colors">Features</a>
            <a href="#capabilities" className="hover:text-nvidia-green transition-colors">Capabilities</a>
            <a href="#download" className="hover:text-nvidia-green transition-colors">Download</a>
          </nav>

          <div className="flex items-center gap-4">
            <a 
              href="https://github.com/Vinodh-Shekhar/FrameBench-Analyzer" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-nvidia-muted hover:text-nvidia-green transition-colors"
            >
              <Github size={20} />
            </a>
            <Button variant="primary" size="sm" href="analyzer/" className="hidden sm:flex">
              Launch App
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
