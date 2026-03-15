import { useEffect, useState } from 'react'

interface Props {
  onComplete?: () => void
  duration?: number
}

export default function SplashScreen({ onComplete, duration = 2200 }: Props) {
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => {
      setHidden(true)
      setTimeout(() => onComplete?.(), 800)
    }, duration)
    return () => clearTimeout(t)
  }, [duration, onComplete])

  return (
    <>
      <div className={`crm-splash ${hidden ? 'crm-splash--hidden' : ''}`}>
        <div className="crm-splash__logo">CORALÉA</div>
        <div className="crm-splash__line" />
        <div className="crm-splash__sub">Private Retreat · CRM</div>
      </div>

      <style>{`
        .crm-splash {
          position: fixed;
          inset: 0;
          z-index: 9999;
          background: #0a0908;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 20px;
          transition: opacity 0.8s ease, visibility 0.8s ease;
        }
        .crm-splash--hidden {
          opacity: 0;
          visibility: hidden;
        }
        .crm-splash__logo {
          font-family: 'Cinzel', serif;
          font-size: 22px;
          letter-spacing: 0.42em;
          color: #c9a96e;
          opacity: 0;
          animation: splashFadeIn 0.9s ease 0.3s forwards;
        }
        .crm-splash__line {
          width: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, #c9a96e, transparent);
          animation: splashLine 1.4s ease 0.6s forwards;
        }
        .crm-splash__sub {
          font-family: 'Cormorant Garamond', serif;
          font-size: 13px;
          font-style: italic;
          letter-spacing: 0.22em;
          color: #5c5247;
          opacity: 0;
          animation: splashFadeIn 0.8s ease 1.1s forwards;
        }
        @keyframes splashFadeIn {
          to { opacity: 1; }
        }
        @keyframes splashLine {
          to { width: 120px; }
        }
      `}</style>
    </>
  )
}
