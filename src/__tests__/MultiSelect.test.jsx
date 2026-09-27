import { describe, it, expect, afterEach } from 'vitest'
import { useState } from 'react'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import MultiSelect from '../components/MultiSelect.jsx'
import { translations } from '../i18n.js'

afterEach(cleanup)

function Harness(props) {
  const [selected, setSelected] = useState([])
  return (
    <>
      <label htmlFor="ms">Pick</label>
      <MultiSelect id="ms" selected={selected} onChange={setSelected} t={translations.EN} {...props} />
      <output data-testid="value">{selected.join('|')}</output>
    </>
  )
}

describe('MultiSelect', () => {
  it('lists markets by default and is reachable through its label', () => {
    render(<Harness />)
    const trigger = screen.getByLabelText('Pick')
    expect(trigger.tagName).toBe('BUTTON')
    fireEvent.click(trigger)
    const names = screen.getAllByRole('option').map((o) => o.textContent)
    expect(names).toContain('United States')
    expect(names).toContain('European Union')
  })

  it('uses the options it is given (regression: buyer categories showed markets)', () => {
    const options = [
      { code: 'Industrial Machinery', label: 'Industrial Machinery' },
      { code: 'Textiles & Apparel', label: 'Textiles & Apparel' },
    ]
    render(<Harness options={options} placeholder="Select categories..." summary="selected" />)
    expect(screen.getByLabelText('Pick').textContent).toContain('Select categories...')

    fireEvent.click(screen.getByLabelText('Pick'))
    const names = screen.getAllByRole('option').map((o) => o.textContent)
    expect(names).toEqual(['Industrial Machinery', 'Textiles & Apparel'])
    expect(names).not.toContain('United States')
  })

  it('toggles options, reports the selection and can remove a chip', () => {
    render(<Harness />)
    fireEvent.click(screen.getByLabelText('Pick'))
    fireEvent.click(screen.getByRole('option', { name: 'United States' }))
    fireEvent.click(screen.getByRole('option', { name: 'ASEAN' }))

    expect(screen.getByTestId('value').textContent).toBe('us|asean')
    expect(screen.getByRole('option', { name: 'ASEAN' }).getAttribute('aria-selected')).toBe('true')

    fireEvent.click(screen.getByRole('button', { name: 'Remove United States' }))
    expect(screen.getByTestId('value').textContent).toBe('asean')
  })

  it('closes on Escape', () => {
    render(<Harness />)
    const trigger = screen.getByLabelText('Pick')
    fireEvent.click(trigger)
    expect(trigger.getAttribute('aria-expanded')).toBe('true')
    fireEvent.keyDown(screen.getByRole('listbox'), { key: 'Escape' })
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
  })
})
