import { renderHook, act } from '@testing-library/react';
import { useNavigationStore } from '../../stores/useNavigationStore';

describe('useNavigationStore', () => {
  beforeEach(() => {
    useNavigationStore.setState({
      screen: 'welcome',
      params: null,
      history: [],
    });
  });

  it('should navigate to a new screen', () => {
    const { result } = renderHook(() => useNavigationStore());

    act(() => {
      result.current.navigate('home');
    });

    expect(result.current.screen).toBe('home');
    expect(result.current.history).toContain('welcome');
  });

  it('should navigate with params', () => {
    const { result } = renderHook(() => useNavigationStore());

    act(() => {
      result.current.navigate('azkarList', { categoryId: 'morning' });
    });

    expect(result.current.screen).toBe('azkarList');
    expect(result.current.params).toEqual({ categoryId: 'morning' });
  });

  it('should go back to previous screen', () => {
    const { result } = renderHook(() => useNavigationStore());

    act(() => {
      result.current.navigate('home');
      result.current.navigate('categories');
    });

    act(() => {
      result.current.goBack();
    });

    expect(result.current.screen).toBe('home');
  });

  it('should reset navigation state', () => {
    const { result } = renderHook(() => useNavigationStore());

    act(() => {
      result.current.navigate('home');
      result.current.navigate('categories');
      result.current.reset();
    });

    expect(result.current.screen).toBe('home');
    expect(result.current.params).toBeNull();
    expect(result.current.history).toEqual([]);
  });
});
