

import { Route as rootRouteImport } from './routes/__root'
import { Route as IndexRouteImport } from './routes/index'
import { Route as AuthenticatedRouteRouteImport } from './routes/_authenticated/route'
import { Route as AreaEmpresaRouteImport } from './routes/area-empresa'
import { Route as AuthRouteImport } from './routes/auth'
import { Route as PrivacidadeRouteImport } from './routes/privacidade'
import { Route as ResetPasswordRouteImport } from './routes/reset-password'
import { Route as SobreRouteImport } from './routes/sobre'
import { Route as AuthenticatedCadastroRouteImport } from './routes/_authenticated/cadastro'
import { Route as AuthenticatedCandidateProfileRouteImport } from './routes/_authenticated/perfil-do-candidato.$applicationId'
import { Route as AuthenticatedPerfilRouteImport } from './routes/_authenticated/perfil'
import { Route as AuthenticatedPublicarRouteImport } from './routes/_authenticated/publicar'
import { Route as AuthenticatedAlertasRouteImport } from './routes/_authenticated/alertas'
import { Route as AuthenticatedCalendarioRouteImport } from './routes/_authenticated/calendario'
import { Route as AuthenticatedVagasSalvasRouteImport } from './routes/_authenticated/vagas-salvas'
import { Route as EmpresasIndexRouteImport } from './routes/empresas.index'
import { Route as EmpresasSlugRouteImport } from './routes/empresas.$slug'
import { Route as EventosIndexRouteImport } from './routes/eventos.index'
import { Route as EventosIdRouteImport } from './routes/eventos.$id'
import { Route as VagasIndexRouteImport } from './routes/vagas.index'
import { Route as VagasSlugRouteImport } from './routes/vagas.$slug'

const IndexRoute = IndexRouteImport.update({
  id: '/',
  path: '/',
  getParentRoute: () => rootRouteImport,
} as any)
const AuthenticatedRouteRoute = AuthenticatedRouteRouteImport.update({
  id: '/_authenticated',
  getParentRoute: () => rootRouteImport,
} as any)
const AreaEmpresaRoute = AreaEmpresaRouteImport.update({
  id: '/area-empresa',
  path: '/area-empresa',
  getParentRoute: () => rootRouteImport,
} as any)
const AuthRoute = AuthRouteImport.update({
  id: '/auth',
  path: '/auth',
  getParentRoute: () => rootRouteImport,
} as any)
const PrivacidadeRoute = PrivacidadeRouteImport.update({
  id: '/privacidade',
  path: '/privacidade',
  getParentRoute: () => rootRouteImport,
} as any)
const ResetPasswordRoute = ResetPasswordRouteImport.update({
  id: '/reset-password',
  path: '/reset-password',
  getParentRoute: () => rootRouteImport,
} as any)
const SobreRoute = SobreRouteImport.update({
  id: '/sobre',
  path: '/sobre',
  getParentRoute: () => rootRouteImport,
} as any)
const AuthenticatedCadastroRoute = AuthenticatedCadastroRouteImport.update({
  id: '/cadastro',
  path: '/cadastro',
  getParentRoute: () => AuthenticatedRouteRoute,
} as any)
const AuthenticatedCandidateProfileRoute = AuthenticatedCandidateProfileRouteImport.update({
  id: '/perfil-do-candidato/$applicationId',
  path: '/perfil-do-candidato/$applicationId',
  getParentRoute: () => AuthenticatedRouteRoute,
} as any)
const AuthenticatedPerfilRoute = AuthenticatedPerfilRouteImport.update({
  id: '/perfil',
  path: '/perfil',
  getParentRoute: () => AuthenticatedRouteRoute,
} as any)
const AuthenticatedPublicarRoute = AuthenticatedPublicarRouteImport.update({
  id: '/publicar',
  path: '/publicar',
  getParentRoute: () => AuthenticatedRouteRoute,
} as any)
const AuthenticatedAlertasRoute = AuthenticatedAlertasRouteImport.update({ id: '/alertas', path: '/alertas', getParentRoute: () => AuthenticatedRouteRoute } as any)
const AuthenticatedCalendarioRoute = AuthenticatedCalendarioRouteImport.update({ id: '/calendario', path: '/calendario', getParentRoute: () => AuthenticatedRouteRoute } as any)
const AuthenticatedVagasSalvasRoute = AuthenticatedVagasSalvasRouteImport.update({ id: '/vagas-salvas', path: '/vagas-salvas', getParentRoute: () => AuthenticatedRouteRoute } as any)
const EmpresasIndexRoute = EmpresasIndexRouteImport.update({
  id: '/empresas/',
  path: '/empresas/',
  getParentRoute: () => rootRouteImport,
} as any)
const EmpresasSlugRoute = EmpresasSlugRouteImport.update({
  id: '/empresas/$slug',
  path: '/empresas/$slug',
  getParentRoute: () => rootRouteImport,
} as any)
const EventosIndexRoute = EventosIndexRouteImport.update({
  id: '/eventos/',
  path: '/eventos/',
  getParentRoute: () => rootRouteImport,
} as any)
const EventosIdRoute = EventosIdRouteImport.update({
  id: '/eventos/$id',
  path: '/eventos/$id',
  getParentRoute: () => rootRouteImport,
} as any)
const VagasIndexRoute = VagasIndexRouteImport.update({
  id: '/vagas/',
  path: '/vagas/',
  getParentRoute: () => rootRouteImport,
} as any)
const VagasSlugRoute = VagasSlugRouteImport.update({
  id: '/vagas/$slug',
  path: '/vagas/$slug',
  getParentRoute: () => rootRouteImport,
} as any)

export interface FileRoutesByFullPath {
  '/': typeof IndexRoute
  '/area-empresa': typeof AreaEmpresaRoute
  '/auth': typeof AuthRoute
  '/privacidade': typeof PrivacidadeRoute
  '/reset-password': typeof ResetPasswordRoute
  '/sobre': typeof SobreRoute
  '/cadastro': typeof AuthenticatedCadastroRoute
  '/perfil-do-candidato/$applicationId': typeof AuthenticatedCandidateProfileRoute
  '/perfil': typeof AuthenticatedPerfilRoute
  '/publicar': typeof AuthenticatedPublicarRoute
  '/alertas': typeof AuthenticatedAlertasRoute
  '/calendario': typeof AuthenticatedCalendarioRoute
  '/vagas-salvas': typeof AuthenticatedVagasSalvasRoute
  '/empresas/$slug': typeof EmpresasSlugRoute
  '/eventos/$id': typeof EventosIdRoute
  '/vagas/$slug': typeof VagasSlugRoute
  '/empresas/': typeof EmpresasIndexRoute
  '/eventos/': typeof EventosIndexRoute
  '/vagas/': typeof VagasIndexRoute
}
export interface FileRoutesByTo {
  '/': typeof IndexRoute
  '/area-empresa': typeof AreaEmpresaRoute
  '/auth': typeof AuthRoute
  '/privacidade': typeof PrivacidadeRoute
  '/reset-password': typeof ResetPasswordRoute
  '/sobre': typeof SobreRoute
  '/cadastro': typeof AuthenticatedCadastroRoute
  '/perfil-do-candidato/$applicationId': typeof AuthenticatedCandidateProfileRoute
  '/perfil': typeof AuthenticatedPerfilRoute
  '/publicar': typeof AuthenticatedPublicarRoute
  '/alertas': typeof AuthenticatedAlertasRoute
  '/calendario': typeof AuthenticatedCalendarioRoute
  '/vagas-salvas': typeof AuthenticatedVagasSalvasRoute
  '/empresas/$slug': typeof EmpresasSlugRoute
  '/eventos/$id': typeof EventosIdRoute
  '/vagas/$slug': typeof VagasSlugRoute
  '/empresas': typeof EmpresasIndexRoute
  '/eventos': typeof EventosIndexRoute
  '/vagas': typeof VagasIndexRoute
}
export interface FileRoutesById {
  __root__: typeof rootRouteImport
  '/': typeof IndexRoute
  '/_authenticated': typeof AuthenticatedRouteRouteWithChildren
  '/area-empresa': typeof AreaEmpresaRoute
  '/auth': typeof AuthRoute
  '/privacidade': typeof PrivacidadeRoute
  '/reset-password': typeof ResetPasswordRoute
  '/sobre': typeof SobreRoute
  '/_authenticated/cadastro': typeof AuthenticatedCadastroRoute
  '/_authenticated/perfil-do-candidato/$applicationId': typeof AuthenticatedCandidateProfileRoute
  '/_authenticated/perfil': typeof AuthenticatedPerfilRoute
  '/_authenticated/publicar': typeof AuthenticatedPublicarRoute
  '/_authenticated/alertas': typeof AuthenticatedAlertasRoute
  '/_authenticated/calendario': typeof AuthenticatedCalendarioRoute
  '/_authenticated/vagas-salvas': typeof AuthenticatedVagasSalvasRoute
  '/empresas/$slug': typeof EmpresasSlugRoute
  '/eventos/$id': typeof EventosIdRoute
  '/vagas/$slug': typeof VagasSlugRoute
  '/empresas/': typeof EmpresasIndexRoute
  '/eventos/': typeof EventosIndexRoute
  '/vagas/': typeof VagasIndexRoute
}
export interface FileRouteTypes {
  fileRoutesByFullPath: FileRoutesByFullPath
  fullPaths:
    | '/'
    | '/area-empresa'
    | '/auth'
    | '/privacidade'
    | '/reset-password'
    | '/sobre'
    | '/cadastro'
    | '/perfil-do-candidato/$applicationId'
    | '/perfil'
    | '/publicar'
    | '/alertas'
    | '/calendario'
    | '/vagas-salvas'
    | '/empresas/$slug'
    | '/eventos/$id'
    | '/vagas/$slug'
    | '/empresas/'
    | '/eventos/'
    | '/vagas/'
  fileRoutesByTo: FileRoutesByTo
  to:
    | '/'
    | '/area-empresa'
    | '/auth'
    | '/privacidade'
    | '/reset-password'
    | '/sobre'
    | '/cadastro'
    | '/perfil-do-candidato/$applicationId'
    | '/perfil'
    | '/publicar'
    | '/alertas'
    | '/calendario'
    | '/vagas-salvas'
    | '/empresas/$slug'
    | '/eventos/$id'
    | '/vagas/$slug'
    | '/empresas'
    | '/eventos'
    | '/vagas'
  id:
    | '__root__'
    | '/'
    | '/_authenticated'
    | '/area-empresa'
    | '/auth'
    | '/privacidade'
    | '/reset-password'
    | '/sobre'
    | '/_authenticated/cadastro'
    | '/_authenticated/perfil-do-candidato/$applicationId'
    | '/_authenticated/perfil'
    | '/_authenticated/publicar'
    | '/_authenticated/alertas'
    | '/_authenticated/calendario'
    | '/_authenticated/vagas-salvas'
    | '/empresas/$slug'
    | '/eventos/$id'
    | '/vagas/$slug'
    | '/empresas/'
    | '/eventos/'
    | '/vagas/'
  fileRoutesById: FileRoutesById
}
export interface RootRouteChildren {
  IndexRoute: typeof IndexRoute
  AuthenticatedRouteRoute: typeof AuthenticatedRouteRouteWithChildren
  AreaEmpresaRoute: typeof AreaEmpresaRoute
  AuthRoute: typeof AuthRoute
  PrivacidadeRoute: typeof PrivacidadeRoute
  ResetPasswordRoute: typeof ResetPasswordRoute
  SobreRoute: typeof SobreRoute
  EmpresasSlugRoute: typeof EmpresasSlugRoute
  EventosIdRoute: typeof EventosIdRoute
  VagasSlugRoute: typeof VagasSlugRoute
  EmpresasIndexRoute: typeof EmpresasIndexRoute
  EventosIndexRoute: typeof EventosIndexRoute
  VagasIndexRoute: typeof VagasIndexRoute
}

declare module '@tanstack/react-router' {
  interface FileRoutesByPath {
    '/': {
      id: '/'
      path: '/'
      fullPath: '/'
      preLoaderRoute: typeof IndexRouteImport
      parentRoute: typeof rootRouteImport
    }
    '/_authenticated': {
      id: '/_authenticated'
      path: ''
      fullPath: '/'
      preLoaderRoute: typeof AuthenticatedRouteRouteImport
      parentRoute: typeof rootRouteImport
    }
    '/area-empresa': {
      id: '/area-empresa'
      path: '/area-empresa'
      fullPath: '/area-empresa'
      preLoaderRoute: typeof AreaEmpresaRouteImport
      parentRoute: typeof rootRouteImport
    }
    '/auth': {
      id: '/auth'
      path: '/auth'
      fullPath: '/auth'
      preLoaderRoute: typeof AuthRouteImport
      parentRoute: typeof rootRouteImport
    }
    '/privacidade': {
      id: '/privacidade'
      path: '/privacidade'
      fullPath: '/privacidade'
      preLoaderRoute: typeof PrivacidadeRouteImport
      parentRoute: typeof rootRouteImport
    }
    '/reset-password': {
      id: '/reset-password'
      path: '/reset-password'
      fullPath: '/reset-password'
      preLoaderRoute: typeof ResetPasswordRouteImport
      parentRoute: typeof rootRouteImport
    }
    '/sobre': {
      id: '/sobre'
      path: '/sobre'
      fullPath: '/sobre'
      preLoaderRoute: typeof SobreRouteImport
      parentRoute: typeof rootRouteImport
    }
    '/_authenticated/cadastro': {
      id: '/_authenticated/cadastro'
      path: '/cadastro'
      fullPath: '/cadastro'
      preLoaderRoute: typeof AuthenticatedCadastroRouteImport
      parentRoute: typeof AuthenticatedRouteRoute
    }
    '/_authenticated/perfil-do-candidato/$applicationId': {
      id: '/_authenticated/perfil-do-candidato/$applicationId'
      path: '/perfil-do-candidato/$applicationId'
      fullPath: '/perfil-do-candidato/$applicationId'
      preLoaderRoute: typeof AuthenticatedCandidateProfileRouteImport
      parentRoute: typeof AuthenticatedRouteRoute
    }
    '/_authenticated/perfil': {
      id: '/_authenticated/perfil'
      path: '/perfil'
      fullPath: '/perfil'
      preLoaderRoute: typeof AuthenticatedPerfilRouteImport
      parentRoute: typeof AuthenticatedRouteRoute
    }
    '/_authenticated/publicar': {
      id: '/_authenticated/publicar'
      path: '/publicar'
      fullPath: '/publicar'
      preLoaderRoute: typeof AuthenticatedPublicarRouteImport
      parentRoute: typeof AuthenticatedRouteRoute
    }
    '/empresas/': {
      id: '/empresas/'
      path: '/empresas'
      fullPath: '/empresas/'
      preLoaderRoute: typeof EmpresasIndexRouteImport
      parentRoute: typeof rootRouteImport
    }
    '/empresas/$slug': {
      id: '/empresas/$slug'
      path: '/empresas/$slug'
      fullPath: '/empresas/$slug'
      preLoaderRoute: typeof EmpresasSlugRouteImport
      parentRoute: typeof rootRouteImport
    }
    '/eventos/': {
      id: '/eventos/'
      path: '/eventos'
      fullPath: '/eventos/'
      preLoaderRoute: typeof EventosIndexRouteImport
      parentRoute: typeof rootRouteImport
    }
    '/eventos/$id': {
      id: '/eventos/$id'
      path: '/eventos/$id'
      fullPath: '/eventos/$id'
      preLoaderRoute: typeof EventosIdRouteImport
      parentRoute: typeof rootRouteImport
    }
    '/vagas/': {
      id: '/vagas/'
      path: '/vagas'
      fullPath: '/vagas/'
      preLoaderRoute: typeof VagasIndexRouteImport
      parentRoute: typeof rootRouteImport
    }
    '/vagas/$slug': {
      id: '/vagas/$slug'
      path: '/vagas/$slug'
      fullPath: '/vagas/$slug'
      preLoaderRoute: typeof VagasSlugRouteImport
      parentRoute: typeof rootRouteImport
    }
  }
}

interface AuthenticatedRouteRouteChildren {
  AuthenticatedCadastroRoute: typeof AuthenticatedCadastroRoute
  AuthenticatedCandidateProfileRoute: typeof AuthenticatedCandidateProfileRoute
  AuthenticatedPerfilRoute: typeof AuthenticatedPerfilRoute
  AuthenticatedPublicarRoute: typeof AuthenticatedPublicarRoute
  AuthenticatedAlertasRoute: typeof AuthenticatedAlertasRoute
  AuthenticatedCalendarioRoute: typeof AuthenticatedCalendarioRoute
  AuthenticatedVagasSalvasRoute: typeof AuthenticatedVagasSalvasRoute
}

const AuthenticatedRouteRouteChildren: AuthenticatedRouteRouteChildren = {
  AuthenticatedCadastroRoute: AuthenticatedCadastroRoute,
  AuthenticatedCandidateProfileRoute: AuthenticatedCandidateProfileRoute,
  AuthenticatedPerfilRoute: AuthenticatedPerfilRoute,
  AuthenticatedPublicarRoute: AuthenticatedPublicarRoute,
  AuthenticatedAlertasRoute: AuthenticatedAlertasRoute,
  AuthenticatedCalendarioRoute: AuthenticatedCalendarioRoute,
  AuthenticatedVagasSalvasRoute: AuthenticatedVagasSalvasRoute,
}

const AuthenticatedRouteRouteWithChildren =
  AuthenticatedRouteRoute._addFileChildren(AuthenticatedRouteRouteChildren)

const rootRouteChildren: RootRouteChildren = {
  IndexRoute: IndexRoute,
  AuthenticatedRouteRoute: AuthenticatedRouteRouteWithChildren,
  AreaEmpresaRoute: AreaEmpresaRoute,
  AuthRoute: AuthRoute,
  PrivacidadeRoute: PrivacidadeRoute,
  ResetPasswordRoute: ResetPasswordRoute,
  SobreRoute: SobreRoute,
  EmpresasSlugRoute: EmpresasSlugRoute,
  EventosIdRoute: EventosIdRoute,
  VagasSlugRoute: VagasSlugRoute,
  EmpresasIndexRoute: EmpresasIndexRoute,
  EventosIndexRoute: EventosIndexRoute,
  VagasIndexRoute: VagasIndexRoute,
}
export const routeTree = rootRouteImport
  ._addFileChildren(rootRouteChildren)
  ._addFileTypes<FileRouteTypes>()

import type { getRouter } from './router.tsx'
import type { startInstance } from './start.ts'
declare module '@tanstack/react-start' {
  interface Register {
    ssr: true
    router: Awaited<ReturnType<typeof getRouter>>
    config: Awaited<ReturnType<typeof startInstance.getOptions>>
  }
}
