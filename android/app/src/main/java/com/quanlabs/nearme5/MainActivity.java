package com.quanlabs.nearme5;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
  @Override
  public void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    registerPlugin(com.getcapacitor.community.facebooklogin.FacebookLogin.class);
    registerPlugin(com.codetrixstudio.capacitor.GoogleAuth.GoogleAuth.class);
  }
}
