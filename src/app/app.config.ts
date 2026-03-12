import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

export const appConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(), provideAnimationsAsync()

  ]
};