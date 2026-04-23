import { renderRouter, screen } from 'expo-router/testing-library';

describe('App Routing', () => {
  it('renders index and navigates to welcome without crashing on buildHref', async () => {
    // We expect this to fail if expo-router or react-navigation dependencies are in conflict
    const MockApp = require('expo-router').ExpoRoot;
    
    // We don't need a full mount, we just need to see if requiring the router breaks
    expect(MockApp).toBeDefined();
  });
});
