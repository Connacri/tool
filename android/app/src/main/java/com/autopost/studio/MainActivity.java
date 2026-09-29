package com.autopost.studio;

import android.os.Bundle;

import androidx.core.splashscreen.SplashScreen;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Installe l'ecran de demarrage et applique le theme de l'application
        // (postSplashScreenTheme) une fois le premier dessin effectue.
        // Sans cet appel, l'activite conserve le theme de lancement sur les
        // versions d'Android ou le splash systeme n'est pas pris en charge.
        SplashScreen.installSplashScreen(this);
        super.onCreate(savedInstanceState);
    }
}
