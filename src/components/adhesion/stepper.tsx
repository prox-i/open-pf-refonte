interface Step {
  label: string
  description: string
}

interface StepperProps {
  steps: Step[]
  currentStep: number
}

export function Stepper({ steps, currentStep }: StepperProps) {
  const total = steps.length
  const current = steps[currentStep - 1]
  const progress = Math.round((currentStep / total) * 100)

  return (
    <nav className="stepper" aria-label="Étapes du formulaire">
      {/* Compact progress — shown on mobile only */}
      <div className="stepper-compact" aria-live="polite">
        <p className="stepper-compact-status">
          Étape {currentStep} sur {total}
        </p>
        <p className="stepper-compact-title">{current?.label}</p>
        <div
          className="stepper-compact-bar"
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={total}
          aria-valuenow={currentStep}
          aria-label={`Progression : étape ${currentStep} sur ${total}`}
        >
          <span style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Full rail — shown on tablet/desktop */}
      <ol className="stepper-rail">
        {steps.map((step, index) => {
          const stepNumber = index + 1
          const isDone = stepNumber < currentStep
          const isActive = stepNumber === currentStep
          const status = isDone ? 'done' : isActive ? 'active' : 'pending'

          return (
            <li key={step.label} className={`stepper-step stepper-step--${status}`}>
              <span
                className="stepper-indicator"
                aria-current={isActive ? 'step' : undefined}
                aria-label={`Étape ${stepNumber} : ${step.label}${isDone ? ' (terminée)' : ''}`}
              >
                {isDone ? (
                  <svg
                    viewBox="0 0 16 16"
                    fill="currentColor"
                    aria-hidden="true"
                    width="14"
                    height="14"
                  >
                    <path d="M13.3 3.3a1 1 0 0 1 0 1.4l-7 7a1 1 0 0 1-1.4 0l-3-3a1 1 0 1 1 1.4-1.4L6 9.6l6.3-6.3a1 1 0 0 1 1.4 0z" />
                  </svg>
                ) : (
                  stepNumber
                )}
              </span>
              <span className="stepper-label">
                <span className="stepper-step-name">{step.label}</span>
                <span className="stepper-step-desc">{step.description}</span>
              </span>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
