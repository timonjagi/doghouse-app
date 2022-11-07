import { NgModule } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { FooterComponent } from './footer.component';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { RouterModule } from '@angular/router';

@NgModule({
  declarations: [
    FooterComponent,
  ],
  imports: [
    CommonModule,
    IonicModule,
    TranslateModule,
    RouterModule,
  ],
  exports: [
    FooterComponent
  ]
})
export class FooterModule {}
