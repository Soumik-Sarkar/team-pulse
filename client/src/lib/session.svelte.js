export function createAppState() {
  const auth = $state({ token: null, user: null, ready: false });
  const data = $state({ activities: [], challenges: [], insights: {}, notifications: [], members: [] });
  const ui = $state({ message: '', loading: false });
  return { auth, data, ui };
}
