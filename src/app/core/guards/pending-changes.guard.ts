import { CanDeactivateFn } from '@angular/router';

export const pendingChangesGuard: CanDeactivateFn<any> = (component) => {
  return component.canDeactivate ? component.canDeactivate() : true;
};