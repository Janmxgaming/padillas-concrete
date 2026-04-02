/**
 * SweetAlert2 utility wrapper with dark theme
 */
import Swal from 'sweetalert2';
import { swalDarkTheme, colors } from './theme';

/** Show success alert with auto-close */
export const showSuccess = (title, text, timer = 2000) => {
  return Swal.fire({
    icon: 'success',
    title,
    text,
    ...swalDarkTheme,
    timer,
    showConfirmButton: timer === 0,
  });
};

/** Show error alert */
export const showError = (title, text) => {
  return Swal.fire({
    icon: 'error',
    title,
    text,
    ...swalDarkTheme,
  });
};

/** Show warning alert */
export const showWarning = (title, text) => {
  return Swal.fire({
    icon: 'warning',
    title,
    text,
    ...swalDarkTheme,
  });
};

/** Show validation errors as bullet list */
export const showValidationErrors = (title, errors) => {
  const errorList = errors.map(e => `• ${e}`).join('<br>');
  return Swal.fire({
    icon: 'warning',
    title,
    html: errorList,
    ...swalDarkTheme,
  });
};

/** Show confirmation dialog - returns true if confirmed */
export const showConfirm = async (title, text, confirmText = 'Yes') => {
  const result = await Swal.fire({
    icon: 'question',
    title,
    text,
    ...swalDarkTheme,
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: 'Cancel',
  });
  return result.isConfirmed;
};

/** Show delete confirmation with image preview */
export const showDeleteConfirm = async (title, imageUrl = null) => {
  const result = await Swal.fire({
    title,
    ...(imageUrl && { imageUrl, imageWidth: 200 }),
    ...swalDarkTheme,
    showCancelButton: true,
    confirmButtonText: 'Delete',
  });
  return result.isConfirmed;
};

/** Show loading indicator */
export const showLoading = (title = 'Loading...') => {
  Swal.fire({
    title,
    ...swalDarkTheme,
    allowOutsideClick: false,
    allowEscapeKey: false,
    showConfirmButton: false,
    didOpen: () => Swal.showLoading(),
  });
};

/** Close any open alert */
export const closeAlert = () => Swal.close();

/** 
 * Show form dialog with custom HTML
 * @returns {Promise<object|null>} Form values or null if cancelled
 */
export const showFormDialog = async ({ title, html, preConfirm, confirmText = 'Save', allowClose = true, didOpen }) => {
  const { value } = await Swal.fire({
    title,
    html,
    ...swalDarkTheme,
    focusConfirm: false,
    showCancelButton: allowClose,
    allowOutsideClick: allowClose,
    allowEscapeKey: allowClose,
    confirmButtonText: confirmText,
    preConfirm,
    ...(didOpen && { didOpen }),
  });
  return value || null;
};

/** Show session expired alert and redirect */
export const showSessionExpired = async (onLogout) => {
  await Swal.fire({
    icon: 'warning',
    title: 'Session Expired',
    text: 'Your session has expired. Please login again.',
    ...swalDarkTheme,
    allowOutsideClick: false,
  });
  onLogout?.();
};
