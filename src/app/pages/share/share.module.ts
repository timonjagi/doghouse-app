import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { SharePage } from './share.page';
import { TranslateModule } from '@ngx-translate/core';
import { ShareButtonsModule } from 'ngx-sharebuttons/buttons';

@NgModule({
  imports: [
    CommonModule,
    IonicModule,
    TranslateModule,
    ShareButtonsModule,
  ],
  declarations: [SharePage],
})
export class SharePageModule {}
