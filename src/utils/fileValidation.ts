/**
 * File validation utilities for secure file uploads
 */

export interface FileValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validate image file type and size
 * @param file - File to validate
 * @param maxSizeBytes - Maximum file size in bytes (default: 5MB)
 * @returns Validation result
 */
export const validateImageFile = (
  file: File,
  maxSizeBytes: number = 5 * 1024 * 1024 // 5MB default
): FileValidationResult => {
  if (!file) {
    return {
      isValid: false,
      error: 'No file provided'
    };
  }

  // Validate file type
  const allowedTypes = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/gif',
    'image/webp'
  ];

  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: 'Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed'
    };
  }

  // Validate file size
  if (file.size > maxSizeBytes) {
    const maxSizeMB = Math.round(maxSizeBytes / (1024 * 1024));
    return {
      isValid: false,
      error: `File size exceeds ${maxSizeMB}MB limit`
    };
  }

  // Validate file name
  if (file.name.length > 255) {
    return {
      isValid: false,
      error: 'File name is too long'
    };
  }

  // Check for potentially malicious file extensions in name
  const suspiciousExtensions = ['.exe', '.bat', '.cmd', '.scr', '.com', '.pif', '.js', '.vbs'];
  const fileName = file.name.toLowerCase();
  
  for (const ext of suspiciousExtensions) {
    if (fileName.includes(ext)) {
      return {
        isValid: false,
        error: 'File name contains potentially unsafe content'
      };
    }
  }

  return {
    isValid: true
  };
};

/**
 * Validate file dimensions (requires image to be loaded)
 * @param file - Image file to validate
 * @param maxWidth - Maximum width in pixels
 * @param maxHeight - Maximum height in pixels
 * @returns Promise with validation result
 */
export const validateImageDimensions = (
  file: File,
  maxWidth: number = 2048,
  maxHeight: number = 2048
): Promise<FileValidationResult> => {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      
      if (img.width > maxWidth || img.height > maxHeight) {
        resolve({
          isValid: false,
          error: `Image dimensions exceed ${maxWidth}x${maxHeight} pixels`
        });
      } else {
        resolve({
          isValid: true
        });
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({
        isValid: false,
        error: 'Unable to load image file'
      });
    };

    img.src = url;
  });
};

/**
 * Comprehensive file validation for image uploads
 * @param file - File to validate
 * @param options - Validation options
 * @returns Promise with validation result
 */
export const validateImageUpload = async (
  file: File,
  options: {
    maxSizeBytes?: number;
    maxWidth?: number;
    maxHeight?: number;
  } = {}
): Promise<FileValidationResult> => {
  // Basic validation first
  const basicValidation = validateImageFile(file, options.maxSizeBytes);
  if (!basicValidation.isValid) {
    return basicValidation;
  }

  // Dimension validation if specified
  if (options.maxWidth || options.maxHeight) {
    const dimensionValidation = await validateImageDimensions(
      file,
      options.maxWidth,
      options.maxHeight
    );
    if (!dimensionValidation.isValid) {
      return dimensionValidation;
    }
  }

  return {
    isValid: true
  };
};