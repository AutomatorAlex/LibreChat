import { useMemo } from 'react';
import type { TUser } from 'librechat-data-provider';

// Default logo path - using your custom logo instead of generated avatars
const DEFAULT_LOGO_PATH = '/assets/logo.webp';

const useAvatar = (user: TUser | undefined) => {
  return useMemo(() => {
    // If user has a custom avatar, use it
    if (user?.avatar && user?.avatar !== '') {
      return user.avatar;
    }

    // Otherwise, use your custom logo as the default avatar
    return DEFAULT_LOGO_PATH;
  }, [user]);
};

export default useAvatar;
