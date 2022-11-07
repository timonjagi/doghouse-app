import { NgModule } from '@angular/core';
import { SharedModule } from 'src/app/shared.module';
import { PlaceSheetModalPage } from './place-sheet-modal.page';

@NgModule({
  imports: [
    SharedModule,
  ],
  declarations: [PlaceSheetModalPage]
})
export class PlaceSheetModalPageModule {}
