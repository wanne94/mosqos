# Component Tests

Component testovi za MosqOS aplikaciju koristeći Vitest + React Testing Library.

## Status

⚠️ **Template testovi kreirani** - Potrebno je implementirati full test logic sa mock-ovima.

## Test Coverage Plan

### 🔒 Security Components (P0 - Kritično)
- [x] `PortalGuard.test.tsx` - Template kreiran
- [x] `RoleGuard.test.tsx` - Template kreiran
- [ ] `ProtectedRoute.test.tsx` - TODO

### 📝 Form Components (P1)
- [ ] `LoginForm.test.tsx` - TODO
- [ ] `MemberForm.test.tsx` - TODO
- [ ] `DonationForm.test.tsx` - TODO

### 🎨 UI Components (P2)
- [ ] `Button.test.tsx` - TODO
- [ ] `Modal.test.tsx` - TODO
- [ ] `Table.test.tsx` - TODO

## Running Tests

```bash
npm run test
```

## Implementacija TODO

Za kompletnu implementaciju testova:

1. **Setup test utils** - Kreirati test helpers za:
   - Mock Supabase client
   - Mock React Query
   - Mock React Router
   - Mock Auth provider

2. **Implement PortalGuard tests**:
   - Mock `useAuth` hook sa različitim scenarijima
   - Mock `useOrganization` hook
   - Mock Supabase `organization_members` query
   - Mock Supabase `platform_admins` query
   - Assert rendering/redirects

3. **Implement RoleGuard tests**:
   - Mock permission provider
   - Test svih permission levels
   - Test unauthorized access scenarios

4. **Add form tests**:
   - Test validation (Zod schemas)
   - Test submission
   - Test error handling

## References

- [Vitest Docs](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Supabase](https://supabase.com/docs/guides/testing)
