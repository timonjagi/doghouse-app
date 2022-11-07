import { NgModule } from '@angular/core';

import { NotificationPage } from './notification.page';
import { SharedModule } from 'src/app/shared.module';

@NgModule({
  imports: [
    SharedModule,
  ],
  declarations: [NotificationPage]
})
export class NotificationPageModule {}
