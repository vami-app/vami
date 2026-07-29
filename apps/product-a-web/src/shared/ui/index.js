/**
 * Re-exports UI atoms from @vami/ui for use within this app.
 *
 * FSD rule: features/ and entities/ import from shared/ui, not directly
 * from @vami/ui. This indirection means we can swap the underlying
 * component library without touching any feature code.
 */
export { Button, Input, Icon, Container, Stack, Grid } from '@vami/ui';
