import { Component, OnInit, Output, EventEmitter, ViewChild, ElementRef, Input } from '@angular/core';
import { Platform, ActionSheetController, AlertController } from '@ionic/angular';
import { ParseFile } from 'src/app/services/parse-file-service';
import { TranslateService } from '@ngx-translate/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

@Component({
  selector: 'app-upload-box',
  templateUrl: './upload-box.component.html',
  styleUrls: ['./upload-box.component.scss']
})
export class UploadBoxComponent implements OnInit {

  @ViewChild('fileInput', { static: true }) fileInput: ElementRef;
  @Input() text: string;
  @Input('file') parseFile: any;
  @Output('onFileUploaded')

  private eventFileUpload: EventEmitter<ParseFile> = new EventEmitter<ParseFile>();
  public isUploading: boolean = false;

  constructor(private platform: Platform,
    private actionSheetCtrl: ActionSheetController,
    private alertCtrl: AlertController,
    private translate: TranslateService) { }

  ngOnInit() {
  }

  onBoxTouched() {
    if (this.platform.is('capacitor')) {
      this.presentActionSheet();
    } else {
      this.fileInput.nativeElement.click();
    }
  }

  async onRemove() {

    const trans = 'CONFIRM_DELETE_IMAGE';
    const message = await this.translate.get(trans).toPromise();

    const confirm = await this.showConfirm(message);

    if (confirm) {
      this.parseFile = null
      this.isUploading = false;
      this.eventFileUpload.emit(null);
    }
  }

  showConfirm(message: string): Promise<boolean> {

    return new Promise(async (resolve) => {

      const str = await this.translate.get(['OK', 'CANCEL'])
        .toPromise();

      const confirm = await this.alertCtrl.create({
        header: '',
        message: message,
        buttons: [{
          text: str.CANCEL,
          role: 'cancel',
          handler: () => resolve(false)
        }, {
          text: str.OK,
          handler: () => resolve(true)
        }]
      });

      confirm.present();

    });

  }

  onFileChanged(event: any = null) {
    this.doUpload(event.target.files[0], false);
  }

  convertBlobToBase64 = (blob: Blob) => new Promise((resolve, reject) => {
    const reader = new FileReader;
    reader.onerror = reject;
    reader.onload = () => {
      resolve(reader.result);
    };
    reader.readAsDataURL(blob);
  });

  async chooseImage(source: CameraSource) {

    try {

      const image = await Camera.getPhoto({
        quality: 70,
        width: 800,
        height: 600,
        preserveAspectRatio: true,
        allowEditing: true,
        correctOrientation: true,
        source: source,
        resultType: CameraResultType.Base64,
      });

      this.doUpload(image.base64String);

    } catch (error) {
      console.warn(error);
    }

  }

  async presentActionSheet() {

    const trans = await this.translate.get([
      'PHOTO_LIBRARY',
      'CAMERA',
      'CANCEL',
      'CHOOSE_AN_OPTION']
    ).toPromise();

    const actionSheet = await this.actionSheetCtrl.create({
      header: trans.CHOOSE_AN_OPTION,
      buttons: [{
        text: trans.PHOTO_LIBRARY,
        handler: () => {
          this.chooseImage(CameraSource.Photos);
        }
      }, {
        text: trans.CAMERA,
        handler: () => {
          this.chooseImage(CameraSource.Camera);
        }
      },{
        text: trans.CANCEL,
        role: 'cancel'
      }]
    });

    return await actionSheet.present();

  }

  async doUpload(fileOrBase64: string, isBase64: boolean = true) {

    try {
      this.isUploading = true;
      this.parseFile = await ParseFile.upload(fileOrBase64, isBase64);
      this.isUploading = false;
      this.eventFileUpload.emit(this.parseFile);
    } catch {
      this.isUploading = false;
    }
    
  }


}
