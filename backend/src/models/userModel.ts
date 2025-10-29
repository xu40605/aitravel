import supabase from '../config/supabase';
import bcrypt from 'bcrypt';

export interface User {
  id: string;
  email: string;
  password_hash: string;
  name?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface UserInput {
  email: string;
  password: string;
  name?: string;
  avatar_url?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  created_at: string;
}

export class UserModel {
  /**
   * 创建新用户
   */
  static async createUser(input: UserInput): Promise<UserProfile> {
    const { email, password, name, avatar_url } = input;
    
    // 检查邮箱是否已存在
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();
      
    if (existingUser) {
      throw new Error('邮箱已被注册');
    }
    
    // 密码加密
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // 创建用户
    const { data, error } = await supabase
      .from('users')
      .insert({
        email,
        password_hash: hashedPassword,
        name,
        avatar_url
      })
      .select('id, email, name, avatar_url, created_at')
      .single();
      
    if (error) {
      throw new Error(error.message);
    }
    
    return data as UserProfile;
  }
  
  /**
   * 根据邮箱查找用户
   */
  static async getUserByEmail(email: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();
      
    if (error) {
      return null;
    }
    
    return data as User;
  }
  
  /**
   * 根据ID查找用户
   */
  static async getUserById(id: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from('users')
      .select('id, email, name, avatar_url, created_at')
      .eq('id', id)
      .single();
      
    if (error) {
      return null;
    }
    
    return data as UserProfile;
  }
  
  /**
   * 验证密码
   */
  static async verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }
  
  /**
   * 更新用户资料
   */
  static async updateProfile(userId: string, data: Partial<Pick<UserInput, 'name' | 'avatar_url'>>): Promise<UserProfile> {
    const { data: updatedUser, error } = await supabase
      .from('users')
      .update(data)
      .eq('id', userId)
      .select('id, email, name, avatar_url, created_at')
      .single();
      
    if (error) {
      throw new Error(error.message);
    }
    
    return updatedUser as UserProfile;
  }
}