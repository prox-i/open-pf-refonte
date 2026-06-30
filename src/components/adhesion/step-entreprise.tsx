'use client'

import { useRef } from 'react'
import type { UseFormReturn } from 'react-hook-form'
import type { AdhesionData } from '@/lib/validations/adhesion'
import { LEGAL_STATUSES } from '@/lib/data/referentials'

interface Props {
  form: UseFormReturn<AdhesionData>
}

export function StepEntreprise({ form }: Props) {
  const {
    register,
    formState: { errors },
  } = form

  const yearField = register('yearFounded', {
    setValueAs: (v: string) => (v === '' ? undefined : parseInt(v, 10)),
  })
  const prevYearRef = useRef('')
  return (
    <fieldset className="form-step">
      <legend className="form-step-legend">Informations entreprise</legend>
      <div className="form-grid">
        <div className="form-field form-field--full">
          <label htmlFor="name">
            Raison sociale <span aria-hidden="true">*</span>
          </label>
          <input
            id="name"
            type="text"
            autoComplete="organization"
            aria-required="true"
            aria-describedby={errors.name ? 'name-error' : undefined}
            {...register('name')}
          />
          {errors.name && (
            <p id="name-error" className="field-error" role="alert">
              {errors.name.message}
            </p>
          )}
        </div>

        <div className="form-field">
          <label htmlFor="legalStatus">
            Statut juridique <span aria-hidden="true">*</span>
          </label>
          <select
            id="legalStatus"
            aria-required="true"
            aria-describedby={errors.legalStatus ? 'legalStatus-error' : undefined}
            {...register('legalStatus')}
          >
            <option value="">Choisir…</option>
            {LEGAL_STATUSES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
          {errors.legalStatus && (
            <p id="legalStatus-error" className="field-error" role="alert">
              {errors.legalStatus.message}
            </p>
          )}
        </div>

        <div className="form-field">
          <label htmlFor="tahitiNumber">N° TAHITI</label>
          <input
            id="tahitiNumber"
            type="text"
            placeholder="123456"
            aria-describedby={
              errors.tahitiNumber ? 'tahitiNumber-error' : 'tahitiNumber-hint'
            }
            {...register('tahitiNumber')}
          />
          <p id="tahitiNumber-hint" className="help-text">
            6 chiffres, optionnellement suivi d&apos;une lettre
          </p>
          {errors.tahitiNumber && (
            <p id="tahitiNumber-error" className="field-error" role="alert">
              {errors.tahitiNumber.message}
            </p>
          )}
        </div>

        <div className="form-field">
          <label htmlFor="websiteUrl">Site web</label>
          <input
            id="websiteUrl"
            type="text"
            placeholder="www.monsite.pf"
            aria-describedby={errors.websiteUrl ? 'websiteUrl-error' : 'websiteUrl-hint'}
            {...register('websiteUrl', {
              setValueAs: (v: string) => {
                if (!v) return v
                if (/^www\./i.test(v)) return `https://${v}`
                return v
              },
            })}
          />
          <p id="websiteUrl-hint" className="help-text">
            Ex : www.monsite.pf ou https://monsite.pf
          </p>
          {errors.websiteUrl && (
            <p id="websiteUrl-error" className="field-error" role="alert">
              {errors.websiteUrl.message}
            </p>
          )}
        </div>

        <div className="form-field">
          <label htmlFor="yearFounded">Année de création</label>
          <input
            id="yearFounded"
            type="number"
            min="1900"
            max={new Date().getFullYear()}
            placeholder="2010"
            inputMode="numeric"
            autoComplete="off"
            data-1p-ignore="true"
            data-lpignore="true"
            {...yearField}
            onChange={(e) => {
              // Stepper/flèches sur un champ vide retombent sur min (1900) :
              // on démarre plutôt à 2010. La saisie au clavier progresse
              // caractère par caractère, donc un saut direct '' → '1900' ne
              // peut venir que du spinner ou des flèches.
              if (prevYearRef.current === '' && e.target.value === '1900') {
                e.target.value = '2010'
              }
              prevYearRef.current = e.target.value
              void yearField.onChange(e)
            }}
          />
        </div>

        <div className="form-field">
          <label htmlFor="employeeCount">Nombre de salariés</label>
          <input
            id="employeeCount"
            type="number"
            min="0"
            placeholder="10"
            inputMode="numeric"
            autoComplete="off"
            data-1p-ignore="true"
            data-lpignore="true"
            {...register('employeeCount', {
              setValueAs: (v: string) => (v === '' ? undefined : parseInt(v, 10)),
            })}
          />
        </div>

        <div className="form-field form-field--full">
          <label htmlFor="description">Description (500 car. max.)</label>
          <textarea
            id="description"
            rows={4}
            maxLength={500}
            aria-describedby={errors.description ? 'description-error' : undefined}
            {...register('description')}
          />
          {errors.description && (
            <p id="description-error" className="field-error" role="alert">
              {errors.description.message}
            </p>
          )}
        </div>

        <div className="form-field form-field--full">
          <label className="checkbox-label">
            <input type="checkbox" {...register('isMedefMember')} />
            <span>Notre entreprise est membre du MEDEF Polynésie française</span>
          </label>
        </div>
      </div>
    </fieldset>
  )
}
