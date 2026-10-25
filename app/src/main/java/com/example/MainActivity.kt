package com.example

import android.annotation.SuppressLint
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.print.PrintAttributes
import android.print.PrintManager
import android.webkit.JavascriptInterface
import android.webkit.JsResult
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.BackHandler
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.FileOpen
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.MoreVert
import androidx.compose.material.icons.filled.Print
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Share
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.viewinterop.AndroidView
import com.example.ui.theme.MyApplicationTheme
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.io.File
import java.io.FileOutputStream

class MainActivity : ComponentActivity() {

  private var webViewRef: WebView? = null
  private var fileUploadCallback: ValueCallback<Array<Uri>>? = null

  // File picker launcher for WebChromeClient input file requests
  private val fileChooserLauncher =
    registerForActivityResult(ActivityResultContracts.StartActivityForResult()) { result ->
      val callback = fileUploadCallback ?: return@registerForActivityResult
      if (result.resultCode == RESULT_OK && result.data != null) {
        val data = result.data
        val uris = WebChromeClient.FileChooserParams.parseResult(result.resultCode, data)
        callback.onReceiveValue(uris)
      } else {
        callback.onReceiveValue(null)
      }
      fileUploadCallback = null
    }

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    enableEdgeToEdge()
    setContent {
      MyApplicationTheme {
        CalculatorScreen(
          activity = this,
          onWebViewReady = { webViewRef = it },
          onOpenFileChooser = { intent, callback ->
            fileUploadCallback = callback
            try {
              fileChooserLauncher.launch(intent)
            } catch (e: Exception) {
              callback.onReceiveValue(null)
              fileUploadCallback = null
            }
          }
        )
      }
    }
  }

  fun printWebView(webView: WebView) {
    try {
      val printManager = getSystemService(Context.PRINT_SERVICE) as? PrintManager
      if (printManager != null) {
        val printAdapter = webView.createPrintDocumentAdapter("Toplotne_Izgube_Porocilo")
        val printJob = printManager.print(
          "Poročilo toplotnih izgub",
          printAdapter,
          PrintAttributes.Builder().build()
        )
        if (printJob != null) {
          Toast.makeText(this, "Odpiranje tiskanja / PDF...", Toast.LENGTH_SHORT).show()
        }
      } else {
        Toast.makeText(this, "Tiskanje na tej napravi ni podprto.", Toast.LENGTH_SHORT).show()
      }
    } catch (e: Exception) {
      Toast.makeText(this, "Napaka pri tiskanju: ${e.localizedMessage}", Toast.LENGTH_SHORT).show()
    }
  }

  fun shareJsonFile(jsonString: String) {
    try {
      val cacheFile = File(cacheDir, "izracun-toplotnih-izgub-v10.2.json")
      FileOutputStream(cacheFile).use { out ->
        out.write(jsonString.toByteArray(Charsets.UTF_8))
      }
      val shareIntent = Intent(Intent.ACTION_SEND).apply {
        type = "application/json"
        putExtra(Intent.EXTRA_TEXT, jsonString)
        putExtra(Intent.EXTRA_SUBJECT, "Izračun toplotnih izgub hiše")
        addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
      }
      startActivity(Intent.createChooser(shareIntent, "Deli ali shrani izračun"))
    } catch (e: Exception) {
      Toast.makeText(this, "Napaka pri deljenju: ${e.localizedMessage}", Toast.LENGTH_SHORT).show()
    }
  }
}

class WebAppInterface(private val activity: MainActivity, private val webView: WebView) {

  @JavascriptInterface
  fun exportJson(jsonString: String) {
    activity.runOnUiThread {
      activity.shareJsonFile(jsonString)
    }
  }

  @JavascriptInterface
  fun printReport() {
    activity.runOnUiThread {
      activity.printWebView(webView)
    }
  }

  @JavascriptInterface
  fun showToast(msg: String) {
    activity.runOnUiThread {
      Toast.makeText(activity, msg, Toast.LENGTH_SHORT).show()
    }
  }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CalculatorScreen(
  activity: MainActivity,
  onWebViewReady: (WebView) -> Unit,
  onOpenFileChooser: (Intent, ValueCallback<Array<Uri>>) -> Unit
) {
  var webViewInstance by remember { mutableStateOf<WebView?>(null) }
  var showMenu by remember { mutableStateOf(false) }
  val coroutineScope = rememberCoroutineScope()

  // Native JSON file import launcher
  val importJsonLauncher = rememberLauncherForActivityResult(
    contract = ActivityResultContracts.GetContent()
  ) { uri: Uri? ->
    uri?.let { fileUri ->
      coroutineScope.launch(Dispatchers.IO) {
        try {
          val content = activity.contentResolver.openInputStream(fileUri)?.use { input ->
            input.bufferedReader().readText()
          } ?: ""
          if (content.isNotBlank()) {
            withContext(Dispatchers.Main) {
              val escaped = org.json.JSONObject.quote(content)
              webViewInstance?.evaluateJavascript("window.applyJsonString($escaped);", null)
            }
          }
        } catch (e: Exception) {
          withContext(Dispatchers.Main) {
            Toast.makeText(activity, "Napaka pri branju datoteke: ${e.localizedMessage}", Toast.LENGTH_SHORT).show()
          }
        }
      }
    }
  }

  BackHandler(enabled = webViewInstance?.canGoBack() == true) {
    webViewInstance?.goBack()
  }

  Scaffold(
    modifier = Modifier.fillMaxSize(),
    topBar = {
      TopAppBar(
        title = {
          Text(
            text = "Toplotne izgube",
            style = MaterialTheme.typography.titleMedium
          )
        },
        colors = TopAppBarDefaults.topAppBarColors(
          containerColor = MaterialTheme.colorScheme.surfaceVariant,
          titleContentColor = MaterialTheme.colorScheme.onSurfaceVariant
        ),
        actions = {
          IconButton(
            onClick = {
              webViewInstance?.evaluateJavascript("loadSampleData();", null)
            },
            modifier = Modifier.testTag("action_load_sample")
          ) {
            Icon(Icons.Default.Home, contentDescription = "Naloži vzorčno hišo (V04)")
          }
          IconButton(
            onClick = {
              webViewInstance?.let { activity.printWebView(it) }
            },
            modifier = Modifier.testTag("action_print")
          ) {
            Icon(Icons.Default.Print, contentDescription = "Natisni / Shrani v PDF")
          }
          IconButton(
            onClick = {
              webViewInstance?.evaluateJavascript("exportJSON();", null)
            },
            modifier = Modifier.testTag("action_export_json")
          ) {
            Icon(Icons.Default.Share, contentDescription = "Deli ali shrani JSON")
          }
          IconButton(
            onClick = { showMenu = true },
            modifier = Modifier.testTag("action_menu")
          ) {
            Icon(Icons.Default.MoreVert, contentDescription = "Več možnosti")
          }
          DropdownMenu(
            expanded = showMenu,
            onDismissRequest = { showMenu = false }
          ) {
            DropdownMenuItem(
              text = { Text("📂 Uvozi JSON datoteko") },
              leadingIcon = { Icon(Icons.Default.FileOpen, contentDescription = null) },
              onClick = {
                showMenu = false
                importJsonLauncher.launch("application/json")
              }
            )
            DropdownMenuItem(
              text = { Text("🏠 Naloži primer hiše (V04)") },
              leadingIcon = { Icon(Icons.Default.Home, contentDescription = null) },
              onClick = {
                showMenu = false
                webViewInstance?.evaluateJavascript("loadSampleData();", null)
              }
            )
            DropdownMenuItem(
              text = { Text("💾 Izvozi / Deli (.json)") },
              leadingIcon = { Icon(Icons.Default.Share, contentDescription = null) },
              onClick = {
                showMenu = false
                webViewInstance?.evaluateJavascript("exportJSON();", null)
              }
            )
            DropdownMenuItem(
              text = { Text("🖨️ PDF Poročilo") },
              leadingIcon = { Icon(Icons.Default.Print, contentDescription = null) },
              onClick = {
                showMenu = false
                webViewInstance?.evaluateJavascript("printFullReport();", null)
              }
            )
            DropdownMenuItem(
              text = { Text("🔄 Ponastavi podatke") },
              leadingIcon = { Icon(Icons.Default.Refresh, contentDescription = null) },
              onClick = {
                showMenu = false
                webViewInstance?.evaluateJavascript("resetDefault();", null)
              }
            )
          }
        }
      )
    }
  ) { innerPadding ->
    Box(
      modifier = Modifier
        .fillMaxSize()
        .padding(innerPadding)
    ) {
      CalculatorWebView(
        activity = activity,
        onWebViewCreated = {
          webViewInstance = it
          onWebViewReady(it)
        },
        onOpenFileChooser = onOpenFileChooser
      )
    }
  }
}

@SuppressLint("SetJavaScriptEnabled")
@Composable
fun CalculatorWebView(
  activity: MainActivity,
  onWebViewCreated: (WebView) -> Unit,
  onOpenFileChooser: (Intent, ValueCallback<Array<Uri>>) -> Unit
) {
  val isDark = isSystemInDarkTheme()

  AndroidView(
    modifier = Modifier
      .fillMaxSize()
      .testTag("calculator_webview"),
    factory = { ctx ->
      WebView(ctx).apply {
        settings.apply {
          javaScriptEnabled = true
          domStorageEnabled = true
          databaseEnabled = true
          allowFileAccess = true
          allowContentAccess = true
          allowFileAccessFromFileURLs = true
          allowUniversalAccessFromFileURLs = true
          useWideViewPort = true
          loadWithOverviewMode = true
          setSupportZoom(true)
          builtInZoomControls = true
          displayZoomControls = false
          cacheMode = WebSettings.LOAD_DEFAULT
        }

        addJavascriptInterface(WebAppInterface(activity, this), "AndroidBridge")

        webViewClient = object : WebViewClient() {
          override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
            val url = request?.url?.toString() ?: return false
            if (url.startsWith("file:///android_asset/")) {
              return false
            }
            // For any external links, open with browser intent
            try {
              val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url))
              activity.startActivity(intent)
            } catch (e: Exception) {
              Toast.makeText(activity, "Povezave ni mogoče odpreti", Toast.LENGTH_SHORT).show()
            }
            return true
          }

          override fun onPageFinished(view: WebView?, url: String?) {
            super.onPageFinished(view, url)
            // Apply system theme on load if user hasn't explicitly toggled
            if (isDark) {
              view?.evaluateJavascript(
                "if (!document.body.classList.contains('dark')) { document.body.classList.add('dark'); }",
                null
              )
            }
          }
        }

        webChromeClient = object : WebChromeClient() {
          override fun onJsAlert(view: WebView?, url: String?, message: String?, result: JsResult?): Boolean {
            Toast.makeText(ctx, message ?: "", Toast.LENGTH_SHORT).show()
            result?.confirm()
            return true
          }

          override fun onJsConfirm(view: WebView?, url: String?, message: String?, result: JsResult?): Boolean {
            android.app.AlertDialog.Builder(activity)
              .setMessage(message ?: "")
              .setPositiveButton(android.R.string.ok) { _, _ -> result?.confirm() }
              .setNegativeButton(android.R.string.cancel) { _, _ -> result?.cancel() }
              .setOnCancelListener { result?.cancel() }
              .show()
            return true
          }

          override fun onShowFileChooser(
            webView: WebView?,
            filePathCallback: ValueCallback<Array<Uri>>?,
            fileChooserParams: FileChooserParams?
          ): Boolean {
            if (filePathCallback == null) return false
            val intent = fileChooserParams?.createIntent() ?: Intent(Intent.ACTION_GET_CONTENT).apply {
              type = "*/*"
              addCategory(Intent.CATEGORY_OPENABLE)
            }
            onOpenFileChooser(intent, filePathCallback)
            return true
          }
        }

        loadUrl("file:///android_asset/www/index.html")
        onWebViewCreated(this)
      }
    }
  )
}
