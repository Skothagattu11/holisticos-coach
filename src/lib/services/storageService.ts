import { supabase, isSupabaseConfigured } from '../supabase';

const BUCKET_NAME = 'avatars';

export const storageService = {
  // Upload an image file and return the public URL
  async uploadProfileImage(file: File, userId: string): Promise<string> {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase not configured');
    }

    // Generate a unique filename with timestamp
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${Date.now()}.${fileExt}`;

    // Upload the file
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (error) {
      console.error('Error uploading image:', error);
      throw new Error('Failed to upload image');
    }

    // Get the public URL
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(data.path);

    return urlData.publicUrl;
  },

  // Delete an image by URL
  async deleteProfileImage(imageUrl: string): Promise<void> {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase not configured');
    }

    // Extract the path from the URL
    const urlParts = imageUrl.split(`${BUCKET_NAME}/`);
    if (urlParts.length < 2) {
      console.warn('Could not extract path from image URL');
      return;
    }

    const path = urlParts[1];

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([path]);

    if (error) {
      console.warn('Error deleting image:', error);
    }
  },
};
