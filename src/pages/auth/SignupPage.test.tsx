import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { SignupPage } from './SignupPage'
import { useAuthStore } from '../../stores/authStore'
import { useUIStore } from '../../stores/uiStore'

// Mock react-router-dom's useNavigate
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

describe('SignupPage Component Workflow', () => {
  const mockSignup = vi.fn()
  const mockSendPass = vi.fn()
  const mockShowToast = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()

    // Override Zustand store state for tests
    useAuthStore.setState({
      signup: mockSignup,
      sendPass: mockSendPass,
    })

    useUIStore.setState({
      showToast: mockShowToast,
    })
  })

  const renderComponent = () =>
    render(
      <MemoryRouter>
        <SignupPage />
      </MemoryRouter>
    )

  it('renders the signup form with initial disabled submit button', () => {
    renderComponent()

    expect(screen.getByRole('heading', { name: /create an account/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/phone number/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()

    const submitBtn = screen.getByRole('button', { name: /send pass/i })
    expect(submitBtn).toBeDisabled()
  })

  it('enables the submit button only when all fields are valid and consent checkbox is checked', async () => {
    renderComponent()

    const submitBtn = screen.getByRole('button', { name: /send pass/i })
    expect(submitBtn).toBeDisabled()

    // Fill first name & last name
    fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: 'Jane' } })
    fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: 'Doe' } })
    expect(submitBtn).toBeDisabled()

    // Fill invalid phone
    fireEvent.change(screen.getByLabelText(/phone number/i), { target: { value: '080123' } })
    expect(submitBtn).toBeDisabled()

    // Fill valid phone
    fireEvent.change(screen.getByLabelText(/phone number/i), { target: { value: '08031234567' } })
    expect(submitBtn).toBeDisabled()

    // Fill valid email
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'jane@example.com' } })
    expect(submitBtn).toBeDisabled()

    // Check consent box
    fireEvent.click(screen.getByLabelText(/i agree to the/i))

    // Now form should be valid and button enabled
    expect(submitBtn).not.toBeDisabled()
  })

  it('handles successful form submission, dispatches pass, and navigates to verification screen', async () => {
    mockSignup.mockResolvedValueOnce(undefined)
    mockSendPass.mockResolvedValueOnce({ message: 'Pass dispatched successfully' })

    renderComponent()

    fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: 'Jane' } })
    fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: 'Doe' } })
    fireEvent.change(screen.getByLabelText(/phone number/i), { target: { value: '08031234567' } })
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'jane@example.com' } })
    fireEvent.click(screen.getByLabelText(/i agree to the/i))

    const submitBtn = screen.getByRole('button', { name: /send pass/i })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(mockSignup).toHaveBeenCalledWith({
        firstName: 'Jane',
        lastName: 'Doe',
        phone: '08031234567',
        email: 'jane@example.com',
      })
      expect(mockSendPass).toHaveBeenCalledWith('08031234567', 'jane@example.com')
      expect(mockShowToast).toHaveBeenCalledWith('Pass dispatched successfully', 'success')
      expect(mockNavigate).toHaveBeenCalledWith('/auth/verify-pass')
    })
  })

  it('displays error toast when signup fails', async () => {
    mockSignup.mockRejectedValueOnce(new Error('Phone number already registered'))

    renderComponent()

    fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: 'Jane' } })
    fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: 'Doe' } })
    fireEvent.change(screen.getByLabelText(/phone number/i), { target: { value: '08031234567' } })
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'jane@example.com' } })
    fireEvent.click(screen.getByLabelText(/i agree to the/i))

    const submitBtn = screen.getByRole('button', { name: /send pass/i })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith('Phone number already registered', 'error')
      expect(mockNavigate).not.toHaveBeenCalled()
    })
  })
})
