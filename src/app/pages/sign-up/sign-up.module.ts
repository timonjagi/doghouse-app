import { NgModule } from '@angular/core';
import { SignUpPage } from './sign-up';
import { SharedModule } from '../../shared.module';
import { FormsModule } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { ContentModalPageModule } from '../content-modal/content-modal.module';
 
@NgModule({
  declarations: [
    SignUpPage,
  ],
  imports: [
    SharedModule,
    FormsModule,
    ReactiveFormsModule,
    ContentModalPageModule,
  ],
})
export class SignUpPageModule {}
