/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

/* Abro la base de datos */
var dir_datos = 'http://www.mobile-promotive.com.ar/uniohio/';
var db = false;
var db = openDatabase('uni_ohio','1','', 3*1024*1024);
var g_usuario=Array();
for(i=0;i<10;i++) g_usuario[i]='';

var app = {
    // Application Constructor
    initialize: function() {
        this.bindEvents();
        //var = openDatabase('uni_ohio','1','', 3*1024*1024);
    },
    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
    },
    // deviceready Event Handler
    //
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicity call 'app.receivedEvent(...);'
    onDeviceReady: function() {
        app.receivedEvent('deviceready');
    },
    // Update DOM on a Received Event
    receivedEvent: function(id) {
        var parentElement = document.getElementById(id);
        var listeningElement = parentElement.querySelector('.listening');
        var receivedElement = parentElement.querySelector('.received');

        listeningElement.setAttribute('style', 'display:none;');
        receivedElement.setAttribute('style', 'display:block;');

        console.log('Received Event: ' + id);
    }
};

/* Verificar si existe base de datos */
function verificar_base(){
  $('#cargando').show();
  if(!db){
    descargar_base_init();    
  }
  else{
    db.transaction(function(tx){tx.executeSql('select * from usuarios', [], function(tx, rs) {
      if(!rs.rows.length){
        descargar_base_init();        
      } 
      else{
        pantalla_login();
      }
    },  
    function(tx,error){ 
        descargar_base_init();
    }
    )});
  }
}

/* Descargo estructura de base de datos y usuarios */
function descargar_base_init(){
    var tablas=Array(
        "configuracion",
        "usuarios",
        "vacas",
        "partos",
        "becerros",
        "calostro",
        "movimientos"
    );
    descargar_tablas_init(db,tablas,0);
}

/* Descargo tablas */
function descargar_tablas_init(db,tablas,index){
    var total=tablas.length;
    var indice=index;
    var error = 0;
    $.ajax({
        type: "post",
        url: dir_datos+"datos.php",
        dataType: "text",
        data: { accion: "descargar_datos", tabla: tablas[indice], init:'si' },
        cache: false,
        success: function( data ){
            if(data){
                var tmp_datos = data.split('###');
                db.transaction(function(tx) {
                    for(i=0;i<tmp_datos.length;i++){
                        if(tmp_datos[i]!=''){ tx.executeSql(tmp_datos[i]); }
                    }                               
                }, function(){ error=1; }, function(){ error=0; } );
            }
            else{
                error = 1;
            }
        },
        complete: function(){ 
            if(error==1){
                alert("error");
            }
            else{
                if(indice==(total-1)){
                     pantalla_login();
                }
                else{
                    descargar_tablas_init(db,tablas,(indice+1));
                }
            }           
        },
        error: function(){
            alert("error");
        }
    });    
}

/* Pantalla Login (HTML) */
function pantalla_login(){
    html='<div class="container">'+
            '<div id="lang" style="margin-top:2%;">'+
                '<h4><a><img onclick="cambiar_idioma(\'en\')" class="english" src="img/fondo.png" /></a></h4>'+
                '<h4><a><img onclick="cambiar_idioma(\'es\')" class="espanol" src="img/fondo.png" /></a></h4>'+
            '</div>'+
            '<div id="logo"><img src="img/logo.png"/></div>'+
            '<div class="input-group input-group-lg loginscreen" >'+
              '<span class="input-group-addon" id="home-ico"><span class="glyphicon glyphicon-user"></span></span>'+
              '<input id="usu_codigo" type="text" class="form-control" placeholder="'+lang.usuario+'">'+
            '</div>'+
            '<div class="input-group input-group-lg">'+
              '<span class="input-group-addon" id="lock-ico"><span class="glyphicon glyphicon-lock"></span></span>'+
              '<input id="usu_password" type="password" class="form-control" placeholder="'+lang.password+'">'+
            '</div>'+
            '<button id="login" type="button" onclick="login()" class="btn btn-primary btn-lg">'+lang.ingresar+'</button>'+
        '</div>';
    $('#app').html(html);
    $('#cargando').hide();
}

/* Acceso de usuarios */
function login(){
    var usu=$('#usu_codigo').val();
    var pass=$('#usu_password').val();
    if(usu!=""&&pass!=""){
        $('#cargando_app').show();
        db.transaction(function(tx){tx.executeSql('select * from usuarios WHERE usu_codigo=? AND usu_password=?', [usu,pass], function(tx, rs) {
          if(rs.rows.length) {
            g_usuario[0]=rs.rows.item(0).usu_codigo;
            g_usuario[1]=rs.rows.item(0).usu_nombre;
            g_usuario[2]=rs.rows.item(0).usu_rodeo;
            g_usuario[3]=rs.rows.item(0).usu_rodeo_desc;
            pantalla_2();            
          }else{
            notificacion("Datos iconrrectos, intente nuevamente.","error");            
          }
        })});        
    }
}

/* Mostrar notificaciones de sistema */
function notificacion(texto,clase){
    $('#cargando_app').hide();
    $('#notificacion').removeClass();
    $('#notificacion').addClass(clase);
    $('#notificacion').html(texto);
    $('#notificacion').css('bottom','-70px');
    $('#notificacion').show();
    $('#notificacion').animate({ bottom: '0' }, 300);
    setTimeout(function(){
      $('#notificacion').animate({ bottom: '-70px' }, 300);
    },3000)
}

/* Pantalla 2 */
function pantalla_2(){
    $('#cargando_app').show();
    var partos='';
    db.transaction(function(tx){tx.executeSql('select * from partos WHERE par_rodeo="'+g_usuario[2]+'" and (par_becerros is null or par_becerros = 0) ORDER BY Datetime(substr(par_fecha,7,4)||"-"||substr(par_fecha,4,2)||"-"||substr(par_fecha,1,2)||" "||substr(par_fecha,12,8))',[], function(tx, rs) {
        if(rs.rows.length) {
            for(i=0;i<rs.rows.length;i++){
                diff=datediff(rs.rows.item(i).par_fecha,current_date(),'minutes');
                if(diff > 90){
                    css_back='red';
                }else if(diff > 30){
                    css_back='orange';
                }else{
                    css_back='green';
                }
                partos=partos+''+
                    '<tr onclick="pantalla_4('+rs.rows.item(i).par_id+','+rs.rows.item(i).par_vaca+')">'+
                        '<td  width="50" height="35" style="background-color:'+css_back+';"></td>'+
                        '<td valign="middle">'+rs.rows.item(i).par_vaca+'</td>'+
                        '<td>'+rs.rows.item(i).par_fecha.substring(11,16)+'</td>'+
                        '<td>'+rs.rows.item(i).par_fecha.substring(0,5)+'</td>'+
                    '</tr>';
            }
        }
        var html=''+
        '<div class="header row">'+
            '<div class="col-xs-6 col-sm-6 col-md-6">'+
            '<button type="button" onclick="actualizar_aceptar()" class="btn btn-success btn-xs" style="float:left;margin:6px 10px 0 0;">'+lang.sincronizar+'</button>'+
            '<h4><strong>Calving App</strong></h4>'+'</div>'+
            '<div class="col-xs-6 col-sm-6 col-md-6" style="text-align: right;"><h4>'+g_usuario[1]+' ('+g_usuario[3]+')&nbsp;&nbsp;&nbsp;&nbsp;<a style="color:red;" href="javascript:pantalla_login()"><span class="glyphicon glyphicon-remove-circle"></span><strong> '+lang.salir+'</strong></a></h4></div>'+
        '</div>'+
        '<div class="container">'+
        '<div class="margins">'+
        '<div class="panel panel-default">'+
          '<div class="panel-heading">'+lang.vacas_activas+': '+rs.rows.length+'</div>'+
          '<div id="tableContainer" class="tableContainer">'+
          '<table id="tabla_fix" class="table table-condensed" >'+
            '<thead>'+
              '<tr>'+
                '<th width="50"></th>'+
                '<th>'+lang.id_vaca+'</th>'+
                '<th>'+lang.hora+'</th>'+
                '<th>'+lang.fecha+'</th>'+
              '</tr>'+
            '</thead>'+
            '<tbody>'+
                partos+          
            '</tbody>'+
           '</table>'+       
           '</div>'+
        '</div>'+
        '<div class="functions">'+
            '<button type="button" onclick="pantalla_3()" class="addcow btn btn-primary btn-lg"><span class="glyphicon glyphicon-plus-sign"></span>'+lang.nuevo_parto+'</button>'+
            '<button id="becerro" onclick="pantalla_7()" type="submit" class="btn btn-primary btn-lg"><img style="margin-top:-5px" src="img/becerro.png">'+lang.becerros+'</button>'+
        '</div>'+
        '</div>'+
        '</div>';
    $('#app').html(html);
    $('#tabla_fix').fixheadertable({ 
        height : 400
    });
    $('#cargando_app').hide();
    })});
}

/* Pantalla 3 */
function pantalla_3(){
    $('#cargando_app').show();
    var html=''+
        '<div class="header row">'+
            '<div class="col-xs-6 col-sm-6 col-md-6">'+
                '<button type="button" onclick="actualizar_aceptar()" class="btn btn-success btn-xs" style="float:left;margin:6px 10px 0 0;">'+lang.sincronizar+'</button>'+
                '<h4><img src="img/vaca.png"/> | <strong>'+lang.info_vaca+'</strong></h4>'+
            '</div>'+
            '<div class="col-xs-6 col-sm-6 col-md-6" style="text-align: right;"><h4>'+g_usuario[1]+' ('+g_usuario[3]+')&nbsp;&nbsp;&nbsp;&nbsp;<a href="javascript:pantalla_2()"><span class="glyphicon glyphicon-arrow-left"></span><strong> '+lang.volver+'</strong></a></h4></div>'+
        '</div>'+
        '<div class="container">'+
            '<form id="frm_comienzo_parto" action="">'+ 
                '<div class="margins">'+
                    '<div class="row">'+
                        '<div class="col-xs-6 col-sm-6 col-md-6">'+
                          '<div class="input-group input-group-sm" >'+
                            '<span class="input-group-addon">'+lang.id_vaca+'</span>'+
                            '<input type="number" onblur="buscar_vaca(this.value)" name="par_vaca" id="par_vaca" class="form-control" placeholder="" maxlength="4" onKeyPress="return soloNumeros(event)">'+
                          '</div>'+
                        '</div>'+
                    '</div>'+  
                    '<div class="row">'+
                    '<div class="col-xs-6 col-sm-6 col-md-6">'+
                      '<div class="input-group input-group-sm" >'+
                        '<span class="input-group-addon">'+lang.lactancia+'</span>'+
                        '<input type="number" class="form-control" placeholder="" maxlength="2" name="par_lactancia" id="par_lactancia">'+
                      '</div>'+
                    '</div>'+
                    '<div class="col-xs-6 col-sm-6 col-md-6">'+
                      '<div class="input-group input-group-sm" >'+
                        '<span class="input-group-addon">'+lang.cc+'</span>'+
                        '<input type="number" class="form-control" placeholder="" name="par_cc" id="par_cc" onKeyPress="return soloNumeros(event)">'+
                      '</div>'+
                    '</div>'+
                '</div>'+
                '<div class="row">'+
                    '<div class="raza col-md-12 col-xs-12 col-sm-12">'+
                        '<h4>'+lang.raza+':</h4>'+
                    '</div>'+
                    '<div id="raza_option"class="col-md-12 col-xs-12 col-sm-12">'+
                        '<div class="btn-toolbar" role="toolbar">'+
                            '<div class="btn-group-justified" data-toggle="buttons">'+
                                '<label class="btn btn-default">'+
                                '<input name="par_vaca_raza" id="par_vaca_raza" type="radio" value="h">H'+
                                '</label>'+
                                '<label class="btn btn-default">'+
                                '<input name="par_vaca_raza" id="par_vaca_raza" type="radio" value="j">J'+
                                '</label>'+
                                '<label class="btn btn-default">'+
                                '<input name="par_vaca_raza" id="par_vaca_raza" type="radio" value="x">X'+
                                '</label>'+
                                '<label class="btn btn-default">'+
                                '<input name="par_vaca_raza" id="par_vaca_raza" type="radio" value="b">B'+
                                '</label>'+
                                '<label class="btn btn-default">'+
                                '<input name="par_vaca_raza" id="par_vaca_raza" type="radio" value="r">R'+
                                '</label>'+
                                '<label class="btn btn-default">'+
                                '<input name="par_vaca_raza" id="par_vaca_raza" type="radio" value="g">G'+
                                '</label>'+
                                '<label class="btn btn-default">'+
                                '<input name="par_vaca_raza" id="par_vaca_raza" type="radio" value=".">.'+
                                '</label>'+
                            '</div>'+
                        '</div>'+
                    '</div>'+
                '</div>'+
                '<div class="row">'+
                    '<div id="higiene" class="col-md-6 col-xs-6 col-sm-6">'+
                        '<h4>'+lang.higiene+'</h4>'+
                    '</div>'+
                    '<div class="col-md-6 col-xs-6 col-sm-6">'+
                        '<div id="perineo" class="btn-toolbar" role="toolbar">'+
                            '<div class="btn-group-justified" data-toggle="buttons">'+
                                '<label class="btn btn-default">'+
                                '<input name="par_higiene" id="par_higiene" type="radio" value="1">1</button>'+
                                '</label>'+
                                '<label class="btn btn-default">'+
                                '<input name="par_higiene" id="par_higiene" type="radio" value="2">2</button>'+
                                '</label>'+
                                '<label class="btn btn-default">'+
                                '<input name="par_higiene" id="par_higiene" type="radio" value="3">3</button>'+
                                '</label>'+
                            '</div>'+
                        '</div>'+
                    '</div>'+
                '</div>'+
                '<div class="row">'+
                    '<div class="col-md-12 col-xs-12 col-sm-12">'+
                        '<div class="input-group input-group-sm" >'+
                            '<span class="input-group-addon">'+lang.tecnico+'</span>'+
                            '<input type="text" class="form-control" placeholder="" name="par_tecnico" id="par_tecnico" value="'+g_usuario[1]+'">'+
                        '</div>'+
                    '</div>'+
                    '<div class="row">'+
                    '<div class="col-md-12 col-xs-12 col-sm-12">'+
                        '<button type="button" onclick="comienza_parto()" class="ready btn btn-primary btn-lg"><span class="glyphicon glyphicon-time"></span><strong> '+lang.comienza_parto+'</strong></button>'+
                    '</div>'+
                '</div>'+
            '</div>'+
        '</div>';
    $('#app').html(html);
    $('#cargando_app').hide();
}

/* Pantalla 4 */
function pantalla_4(par_id,vac_id){
    $('#cargando_app').show();
    var html=''+
        '<div class="header row">'+
            '<div class="col-xs-6 col-sm-6 col-md-6">'+
                '<button type="button" onclick="actualizar_aceptar()" class="btn btn-success btn-xs" style="float:left;margin:6px 10px 0 0;">'+lang.sincronizar+'</button>'+
                '<h4><span class="glyphicon glyphicon-time"></span> | '+lang.parto+'</h4>'+
            '</div>'+
            '<div class="col-xs-6 col-sm-6 col-md-6" style="text-align: right;"><h4>'+g_usuario[1]+' ('+g_usuario[3]+')&nbsp;&nbsp;&nbsp;&nbsp;<a href="javascript:pantalla_2()"><span class="glyphicon glyphicon-arrow-left"></span> '+lang.volver+'</a></h4></div>'+
        '</div>'+
        '<div class="container">'+
            '<div class="margins_small">'+
                '<form id="frm_fin_parto" action="">'+
                    '<div class="row">'+
                        '<div class="col-xs-8 col-sm-8 col-md-8">'+
                            '<div class="input-group input-group-sm" >'+
                                '<span class="input-group-addon">'+lang.id_vaca+'</span>'+
                                '<input readonly type="text" value="'+vac_id+'" class="form-control" style="height: 37px;" placeholder="" maxlength="4">'+
                            '</div>'+
                        '</div>'+
                    '</div>'+
                    '<div class="row">'+
                        '<div id="higiene" class="col-xs-6 col-sm-6 col-md-6">'+
                            '<h4>'+lang.cantidad_becerros+'</h4>'+
                        '</div>'+
                        '<div class="col-xs-6 col-sm-6 col-md-6">'+
                            '<div id="perineo" class="btn-toolbar" role="toolbar">'+
                                '<div class="btn-group-justified" data-toggle="buttons">'+
                                    '<label class="btn btn-default">'+
                                    '<input name="par_becerros" id="par_becerros" type="radio" value="1">1</button>'+
                                    '</label>'+
                                    '<label class="btn btn-default">'+
                                    '<input name="par_becerros" id="par_becerros" type="radio" value="2">2</button>'+
                                    '</label>'+
                                    '<label class="btn btn-default">'+
                                    '<input name="par_becerros" id="par_becerros" type="radio" value="3">3</button>'+
                                    '</label>'+
                                '</div>'+
                            '</div>'+
                        '</div>'+                  
                    '</div>'+
                    '<div class="row">'+
                        '<div class="raza col-xs-12 col-sm-12 col-md-12">'+
                            '<h4>'+lang.dificultad+':</h4>'+
                        '</div>'+
                        '<div id="raza_option"class="col-xs-12 col-sm-12 col-md-12">'+
                            '<div class="btn-toolbar" role="toolbar">'+
                                '<div class="btn-group-justified" data-toggle="buttons">'+
                                    '<label class="btn btn-default">'+
                                    '<input name="par_dificultad" id="par_dificultad" type="radio" value="1">1'+
                                    '</label>'+
                                    '<label class="btn btn-default">'+
                                    '<input name="par_dificultad" id="par_dificultad" type="radio" value="2">2'+
                                    '</label>'+
                                    '<label class="btn btn-default">'+
                                    '<input name="par_dificultad" id="par_dificultad" type="radio" value="3">3'+
                                    '</label>'+
                                    '<label class="btn btn-default">'+
                                    '<input name="par_dificultad" id="par_dificultad" type="radio" value="4">4'+
                                    '</label>'+
                                    '<label class="btn btn-default">'+
                                    '<input name="par_dificultad" id="par_dificultad" type="radio" value="5">5'+
                                    '</label>'+                                    
                                '</div>'+
                            '</div>'+
                        '</div>'+
                    '</div>'+
                    '<div class="row">'+
                        '<div class="raza col-xs-12 col-sm-12 col-md-12">'+
                            '<h4>'+lang.raza+':</h4>'+
                        '</div>'+
                        '<div id="raza_option"class="col-md-12">'+
                            '<div class="btn-toolbar" role="toolbar">'+
                                '<div class="btn-group-justified" data-toggle="buttons">'+
                                    '<label class="btn btn-default">'+
                                        '<input name="par_raza_becerros" id="par_raza_becerros" type="radio" value="h">H'+
                                        '</label>'+
                                        '<label class="btn btn-default">'+
                                        '<input name="par_raza_becerros" id="par_raza_becerros" type="radio" value="j">J'+
                                        '</label>'+
                                        '<label class="btn btn-default">'+
                                        '<input name="par_raza_becerros" id="par_raza_becerros" type="radio" value="x">X'+
                                        '</label>'+
                                        '<label class="btn btn-default">'+
                                        '<input name="par_raza_becerros" id="par_raza_becerros" type="radio" value="b">B'+
                                        '</label>'+
                                        '<label class="btn btn-default">'+
                                        '<input name="par_raza_becerros" id="par_raza_becerros" type="radio" value="r">R'+
                                        '</label>'+
                                        '<label class="btn btn-default">'+
                                        '<input name="par_raza_becerros" id="par_raza_becerros" type="radio" value="g">G'+
                                        '</label>'+
                                        '<label class="btn btn-default">'+
                                        '<input name="par_raza_becerros" id="par_raza_becerros" type="radio" value=".">.'+
                                        '</label>'+
                                    '</div>'+
                                '</div>'+
                            '</div>'+
                        '</div>'+
                    '<div class="row">'+
                        '<div class="col-md-12">'+
                            '<div class="input-group input-group-sm" >'+
                                '<span class="input-group-addon">'+lang.tecnico+'</span>'+
                                '<input type="text" name="par_tecnico_becerros" id="par_tecnico_becerros" class="form-control" placeholder="" value="'+g_usuario[1]+'">'+
                            '</div>'+
                            '<button type="button" onclick="fin_parto('+par_id+')" class="ready btn btn-primary btn-lg"><span class="glyphicon glyphicon-ok"></span> '+lang.listo+'!</button>'+
                        '</div>'+
                    '</div>'+
                '</form>'+
            '</div>'+
        '</div>';
    $('#app').html(html);
    $('#cargando_app').hide();
}

/* Pantalla 5 */
function pantalla_5(par_id,becerro){
    $('#cargando_app').show();
    var html=''+
        '<div class="header row">'+
           '<div class="col-xs-6 col-sm-6 col-md-6">'+
                '<button type="button" onclick="actualizar_aceptar()" class="btn btn-success btn-xs" style="float:left;margin:6px 10px 0 0;">'+lang.sincronizar+'</button>'+
                '<h4><img src="img/becerro4.png"/> | '+lang.becerro+'</h4>'+
            '</div>'+        
           '<div class="col-xs-6 col-sm-6 col-md-6" style="text-align: right;"><h4>'+g_usuario[1]+' ('+g_usuario[3]+')&nbsp;&nbsp;&nbsp;&nbsp;<a href="javascript:pantalla_7()"><span class="glyphicon glyphicon-arrow-left"></span> '+lang.volver+'</a></h4></div>'+
        '</div>'+
        '<div class="container">'+
            '<div class="margins_small">'+
                '<form id="frm_cargar_becerro" action="">'+
                    '<div class="row">'+
                        '<div class="col-xs-12 col-sm-12 col-md-12">'+
                            '<div class="btn-toolbar" role="toolbar">'+
                                '<div id="gender" class="btn-group-justified" data-toggle="buttons">'+
                                    '<label name="lbl_bec_sexo" class="btn btn-default '+($.isArray(becerro)&&becerro[1]=='M'?'active':'')+'">'+
                                        '<input name="bec_sexo" id="bec_sexo" type="radio" value="M" '+($.isArray(becerro)&&becerro[1]=='M'?'checked':'')+'>'+lang.macho+''+
                                    '</label>'+ 
                                    '<label name="lbl_bec_sexo" class="btn btn-default '+($.isArray(becerro)&&becerro[1]=='H'?'active':'')+'">'+
                                        '<input name="bec_sexo" id="bec_sexo" type="radio" value="H" '+($.isArray(becerro)&&becerro[1]=='H'?'checked':'')+'>'+lang.hembra+''+
                                    '</label>'+
                                '</div>'+ 
                            '</div>'+
                        '</div>'+
                    '</div>'+
                    '<div class="row">'+
                        '<div class="col-xs-12 col-sm-12 col-md-12">'+
                            '<div class="btn-toolbar" role="toolbar">'+
                                '<div id="status_b" class="btn-group-justified" data-toggle="buttons">'+
                                    '<label id="lbl_condicion" class="btn btn-default '+($.isArray(becerro)&&becerro[2]=='v'?'active':'')+'">'+
                                    '<input name="bec_condicion" id="bec_condicion" type="radio" value="v" '+($.isArray(becerro)&&becerro[2]=='v'?'checked':'')+'>'+lang.bec_cond_V+''+
                                    '</label>'+
                                    '<label id="lbl_condicion" class="btn btn-default '+($.isArray(becerro)&&becerro[2]=='mf'?'active':'')+'">'+
                                    '<input name="bec_condicion" id="bec_condicion" type="radio" value="mf" '+($.isArray(becerro)&&becerro[2]=='mf'?'checked':'')+'>'+lang.bec_cond_MF+''+
                                    '</label>'+
                                    '<label id="lbl_condicion" class="btn btn-default '+($.isArray(becerro)&&becerro[2]=='a'?'active':'')+'">'+
                                    '<input name="bec_condicion" id="bec_condicion" type="radio" value="a" '+($.isArray(becerro)&&becerro[2]=='a'?'checked':'')+'>'+lang.bec_cond_A+''+
                                    '</label>'+
                                    '<label id="lbl_condicion" class="btn btn-default '+($.isArray(becerro)&&becerro[2]=='p'?'active':'')+'">'+
                                    '<input name="bec_condicion" id="bec_condicion" type="radio" value="p" '+($.isArray(becerro)&&becerro[2]=='p'?'checked':'')+'>'+lang.bec_cond_P+''+
                                    '</label>'+
                                    '<label id="lbl_condicion" class="btn btn-default '+($.isArray(becerro)&&becerro[2]=='m'?'active':'')+'">'+
                                    '<input name="bec_condicion" id="bec_condicion" type="radio" value="m" '+($.isArray(becerro)&&becerro[2]=='m'?'checked':'')+'>'+lang.bec_cond_M+''+
                                    '</label>'+
                                '</div>'+
                            '</div>'+
                        '</div>'+
                    '</div>'+
                    '<div class="row">'+
                        '<div id="higiene" class="col-xs-6 col-sm-6 col-md-6">'+
                            '<h4>'+lang.presentacion+'</h4>'+
                        '</div>'+
                        '<div class="col-xs-6 col-sm-6 col-md-6">'+
                            '<div id="perineo" class="btn-toolbar" role="toolbar">'+
                                '<div class="btn-group-justified" data-toggle="buttons">'+
                                    '<label id="lbl_bec_presentacion" class="btn btn-default '+($.isArray(becerro)&&becerro[3]=='1'?'active':'')+'">'+
                                    '<input name="bec_presentacion" id="bec_presentacion" type="radio" value="1" '+($.isArray(becerro)&&becerro[3]=='1'?'checked':'')+'>1</button>'+
                                    '</label>'+
                                    '<label id="lbl_bec_presentacion" class="btn btn-default '+($.isArray(becerro)&&becerro[3]=='2'?'active':'')+'">'+
                                    '<input name="bec_presentacion" id="bec_presentacion" type="radio" value="2" '+($.isArray(becerro)&&becerro[3]=='2'?'checked':'')+'>2</button>'+
                                    '</label>'+
                                    '<label id="lbl_bec_presentacion" class="btn btn-default '+($.isArray(becerro)&&becerro[3]=='3'?'active':'')+'">'+
                                    '<input name="bec_presentacion" id="bec_presentacion" type="radio" value="3" '+($.isArray(becerro)&&becerro[3]=='3'?'checked':'')+'>3</button>'+
                                    '</label>'+
                                '</div>'+
                            '</div>'+
                        '</div>'+
                    '</div>'+
                    '<div class="row">'+
                        '<div class="col-xs-12 col-sm-12 col-md-12">'+
                            '<div class="input-group input-group-sm" >'+
                                '<span class="input-group-addon">'+lang.caravana+'</span>'+
                                '<input type="number" name="bec_caravana" id="bec_caravana" class="form-control" placeholder="" value="'+($.isArray(becerro)?becerro[4]:'')+'" onKeyPress="return soloNumeros(event)">'+
                            '</div>'+
                            '<div class="input-group input-group-sm" >'+
                                '<span class="input-group-addon">'+lang.tecnico+'</span>'+
                                '<input type="text" name="bec_tecnico" id="bec_tecnico" class="form-control" placeholder="" value="'+($.isArray(becerro)?becerro[5]:g_usuario[1])+'">'+
                            '</div>'+
                            '<button id="btn_agregar_becerro" onclick="cargar_becerro('+par_id+','+($.isArray(becerro)?becerro[6]:0)+')" type="button" class="ready btn btn-primary btn-lg"><span class="glyphicon glyphicon-plus-sign"></span> '+($.isArray(becerro)?lang.actualizar:lang.agregar)+'</button>'+
                        '</div>'+
                    '</div>'+
                '</form>'+
                '<div id="tabla_becerros" style="margin-top:20px" class="row">'+                
                '</div>'+
            '</div>'+
        '</div>';
    mostrar_becerros(par_id,($.isArray(becerro)?becerro[6]:0));    
    $('#app').html(html);
    $('#cargando_app').hide();
}

/* Pantalla 6 */
function pantalla_6(bec_id,bec_caravana){
    $('#cargando_app').show();
    var html=''+
        '<div class="header row">'+
           '<div class="col-xs-6 col-sm-6 col-md-6">'+
                '<button type="button" onclick="actualizar_aceptar()" class="btn btn-success btn-xs" style="float:left;margin:6px 10px 0 0;">'+lang.sincronizar+'</button>'+
                '<h4><img src="img/becerro4.png"/> | '+lang.calostro+'</h4>'+
            '</div>'+
           '<div class="col-xs-6 col-sm-6 col-md-6" style="text-align: right;"><h4>'+g_usuario[1]+' ('+g_usuario[3]+')&nbsp;&nbsp;&nbsp;&nbsp;<a href="javascript:pantalla_7()"><span class="glyphicon glyphicon-arrow-left"></span> '+lang.volver+'</a></h4></div>'+
        '</div>'+
        '<div class="container">'+
            '<div class="margins">'+
                '<form action="" id="frm_cargar_calostro">'+
                    '<div class="row">'+
                        '<div class="col-xs-12 col-sm-12 col-md-12">'+
                            '<div class="input-group input-group-sm" >'+
                                '<span class="input-group-addon">'+lang.caravana+'</span>'+
                                '<input id="bec_caravana" name="bec_caravana" readonly type="text" class="form-control" placeholder="" value="'+bec_caravana+'">'+
                            '</div>'+
                            '<div class="input-group input-group-sm" >'+
                                '<span class="input-group-addon">'+lang.calidad+'</span>'+
                                '<input id="cal_calidad" name="cal_calidad" type="number" class="form-control" placeholder="">'+
                            '</div>'+
                            '<div class="input-group input-group-sm" >'+
                                '<span class="input-group-addon">'+lang.cantidad+'</span>'+
                                '<input id="cal_cantidad" name="cal_cantidad" type="number" class="form-control" placeholder="" onKeyPress="return soloNumeros(event)">'+
                            '</div>'+
                            '<div class="input-group input-group-sm" >'+
                                '<span class="input-group-addon">'+lang.vigor+'</span>'+
                                '<input id="cal_vigor" name="cal_vigor" type="number" class="form-control" placeholder="">'+
                            '</div>'+
                            '<div class="input-group input-group-sm" >'+
                                '<span class="input-group-addon">'+lang.peso_al_nacer+'</span>'+
                                '<input id="cal_peso" name="cal_peso" type="number" class="form-control" placeholder="" >'+
                            '</div>'+
                            '<div class="input-group input-group-sm" >'+
                                '<span class="input-group-addon">'+lang.tecnico+'</span>'+
                                '<input id="cal_tecnico" name="cal_tecnico" type="text" class="form-control" placeholder="Nombre" value="'+g_usuario[1]+'">'+
                            '</div>'+
                        '</div>'+
                    '</div>'+
                    '<div class="row">'+
                        '<button type="button" onclick="cargar_calostro('+bec_id+')" class="ready btn btn-primary btn-lg"><span class="glyphicon glyphicon-ok"></span> '+lang.listo+'!</button>'+
                    '</div>'+
                '</form>'+
            '</div>'+
        '</div>';
    $('#app').html(html);
    $('#cargando_app').hide();
}

/* Pantalla 7 */
function pantalla_7(){
    $('#cargando_app').show();
    var becerros='';
    db.transaction(function(tx){tx.executeSql('select * from becerros, partos WHERE par_rodeo="'+g_usuario[2]+'" and bec_parto=par_id and (bec_muerto<>"S" or bec_muerto is null) and bec_condicion NOT IN ("m","a") and bec_id NOT IN (select cal_becerro FROM calostro where cal_becerro=bec_id) ORDER BY Datetime(substr(bec_fecha,7,4)||"-"||substr(bec_fecha,4,2)||"-"||substr(bec_fecha,1,2)||" "||substr(bec_fecha,12,8))',[], function(tx, rs) {
        if(rs.rows.length) {
            for(i=0;i<rs.rows.length;i++){
                diff=datediff(rs.rows.item(i).bec_fecha,current_date(),'minutes');
                if(diff > 240){
                    css_back='red';
                }else if(diff > 120){
                    css_back='orange';
                }else{
                    css_back='green';
                }
                becerros=becerros+''+
                    '<tr onclick="marcar_becerro('+rs.rows.item(i).bec_id+','+rs.rows.item(i).bec_caravana+')" id="reg_becerro_'+rs.rows.item(i).bec_id+'" name="reg_becerro_'+rs.rows.item(i).bec_id+'">'+
                        '<td valign="middle">'+rs.rows.item(i).par_vaca+'</td>'+
                        '<td valign="middle">'+rs.rows.item(i).bec_caravana+'</td>'+
                        '<td>'+rs.rows.item(i).bec_fecha.substring(11,16)+'</td>'+
                        '<td>'+rs.rows.item(i).bec_fecha.substring(0,5)+'</td>'+
                    '</tr>';
            }
        }
        var html=''+
        '<div class="header row">'+
            '<div class="col-xs-6 col-sm-6 col-md-6">'+
                '<button type="button" onclick="actualizar_aceptar()" class="btn btn-success btn-xs" style="float:left;margin:6px 10px 0 0;">'+lang.sincronizar+'</button>'+
                '<h4><strong>Calving App</strong></h4>'+
            '</div>'+
            '<div class="col-xs-6 col-sm-6 col-md-6" style="text-align: right;"><h4>'+g_usuario[1]+' ('+g_usuario[3]+')&nbsp;&nbsp;&nbsp;&nbsp;<a href="javascript:pantalla_2()"><span class="glyphicon glyphicon-arrow-left"></span><strong> '+lang.volver+'</strong></a></h4></div>'+
        '</div>'+
        '<div class="container">'+
            '<div class="margins">'+
                '<div class="panel panel-default">'+
                    '<div class="panel-heading">'+lang.becerros_activos+': '+rs.rows.length+'</div>'+
                        '<table id="tabla_fix" class="table table-condensed">'+
                            '<thead>'+
                              '<tr>'+
                                '<th>'+lang.id_vaca+'</th>'+
                                '<th>'+lang.becerro+'</th>'+
                                '<th>'+lang.hora+'</th>'+
                                '<th>'+lang.fecha+'</th>'+
                              '</tr>'+
                            '</thead>'+
                            '<tbody>'+             
                                becerros+          
                            '</tbody>'+
                           '</table>'+       
                        '</div>'+
                        '<div class="functions_f">'+
                            '<div class="col-xs-5 col-sm-5 col-md-5">'+
                               '<button onclick="marcar_muerto()" type="button" class="ready btn btn-primary btn-lg">'+lang.muerto.toUpperCase()+'</span></button>'+
                               '<input type="hidden" name="bec_marcado" id="bec_marcado" value="">'+
                               '<input type="hidden" name="bec_nro_marcado" id="bec_nro_marcado" value="">'+
                            '</div>'+
                            '<div class="col-xs-5 col-sm-5 col-md-5">'+
                              '<button onclick="marcar_calostro()" type="button" class="ready btn btn-primary btn-lg">'+lang.calostro.toUpperCase()+'</button>'+
                            '</div>'+
                            '<div class="col-xs-2 col-sm-2 col-md-2">'+
                               '<button type="button" onclick="editar_becerro()" class="ready btn btn-primary btn-lg"><span class="glyphicon glyphicon-pencil" style="border-bottom: white thin solid;"></span></button>'+
                            '</div>'+
                        '</div>'+                        
                    '</div>'+
                '</div>'+
            '</div>'+
        '</div>';
    $('#app').html(html);
    $('#tabla_fix').fixheadertable({ 
        height : 400
    });
    $('#cargando_app').hide();
    })});
}

function comienza_parto(){
    $('#cargando_app').show();    
    if(validar_formulario('frm_comienzo_parto','todos')){
        var values = new Array();
        values[0]=$('#par_vaca').val();
        values[1]=$('#par_lactancia').val();
        values[2]=$('#par_cc').val();
        values[3]=document.querySelector('input[name="par_vaca_raza"]:checked').value;
        values[4]=document.querySelector('input[name="par_higiene"]:checked').value
        values[5]=$('#par_tecnico').val();
        values[6]=current_date();
        values[7]=g_usuario[2];
        values[8]=g_usuario[3];
        db.transaction(function(tx){tx.executeSql('select * from vacas WHERE vac_id=?', [values[0]], function(tx, rs) {
          if(!rs.rows.length) {
            db.transaction(function(tx){tx.executeSql("insert into vacas (vac_id,vac_raza) VALUES ('"+values[0]+"','"+values[3]+"')")});
            ultimo_movimiento("insert into vacas (vac_id,vac_raza) VALUES ('"+values[0]+"','"+values[3]+"')");
          }
          db.transaction(function(tx){tx.executeSql("insert into partos (par_vaca,par_lactancia,par_cc,par_vaca_raza,par_higiene,par_tecnico,par_fecha,par_rodeo,par_rodeo_desc) VALUES ('"+values.join("','")+"')")});
          ultimo_movimiento("insert into partos (par_vaca,par_lactancia,par_cc,par_vaca_raza,par_higiene,par_tecnico,par_fecha,par_rodeo,par_rodeo_desc) VALUES ('"+values.join("','")+"')");
          pantalla_2();
        })});
    }
    $('#cargando_app').hide();
}

function fin_parto(par_id){
    $('#cargando_app').show();    
    if(validar_formulario('frm_fin_parto','todos')){
        var values = new Array();
        values[0]=document.querySelector('input[name="par_becerros"]:checked').value;
        values[1]=document.querySelector('input[name="par_dificultad"]:checked').value;
        values[2]=document.querySelector('input[name="par_raza_becerros"]:checked').value;
        values[3]=$('#par_tecnico_becerros').val();
        values[4]=current_date();
        db.transaction(function(tx){tx.executeSql("update partos set par_becerros='"+values[0]+"', par_dificultad='"+values[1]+"', par_raza_becerros='"+values[2]+"', par_tecnico_becerros='"+values[3]+"', par_fecha_fin='"+values[4]+"' where par_id='"+par_id+"'")});
        ultimo_movimiento("update partos set par_becerros='"+values[0]+"', par_dificultad='"+values[1]+"', par_raza_becerros='"+values[2]+"', par_tecnico_becerros='"+values[3]+"', par_fecha_fin='"+values[4]+"' where par_id='"+par_id+"'");
        pantalla_5(par_id);
    }
    $('#cargando_app').hide();
}

function cargar_becerro(par_id,bec_id){
    $('#cargando_app').show();
    if(validar_formulario('frm_cargar_becerro','todos')){
        var values = new Array();
        values[0]=par_id;
        values[1]=document.querySelector('input[name="bec_sexo"]:checked').value;
        values[2]=document.querySelector('input[name="bec_condicion"]:checked').value;
        values[3]=document.querySelector('input[name="bec_presentacion"]:checked').value;
        values[4]=$('#bec_caravana').val();
        values[5]=$('#bec_tecnico').val();
        values[6]=current_date();
        if(bec_id>0){
            db.transaction(function(tx){tx.executeSql("update becerros set bec_sexo='"+values[1]+"', bec_condicion='"+values[2]+"', bec_presentacion='"+values[3]+"', bec_caravana='"+values[4]+"', bec_tecnico='"+values[5]+"' where bec_id='"+bec_id+"'",[],function(tx,rs){
                ultimo_movimiento("update becerros set bec_sexo='"+values[1]+"', bec_condicion='"+values[2]+"', bec_presentacion='"+values[3]+"', bec_caravana='"+values[4]+"', bec_tecnico='"+values[5]+"' where bec_id='"+bec_id+"'");
                pantalla_5(par_id)            
            })});
        }
        else{
            db.transaction(function(tx){tx.executeSql("insert into becerros (bec_parto,bec_sexo,bec_condicion,bec_presentacion,bec_caravana,bec_tecnico,bec_fecha) VALUES ('"+values.join("','")+"')",[],function(tx,rs){
                ultimo_movimiento("insert into becerros (bec_parto,bec_sexo,bec_condicion,bec_presentacion,bec_caravana,bec_tecnico,bec_fecha) VALUES ('"+values.join("','")+"')");
                pantalla_5(par_id)            
            })});
        }
        
    }
    $('#cargando_app').hide();
}

function mostrar_becerros(par_id,bec_id){
    $('#cargando_app').fadeIn(300)
    var becerros='';
    var display='none';
    db.transaction(function(tx){tx.executeSql('select  * from partos, becerros where par_id=bec_parto and par_id=?', [par_id], function(tx, rs) {
        if(rs.rows.length){
            for(i=0;i<rs.rows.length;i++){
                becerros=becerros+''+
                    '<tr onclick="obtener_becerro('+rs.rows.item(i).bec_id+')">'+
                        '<td height="35" valign="middle">'+rs.rows.item(i).bec_caravana+'</td>'+
                        '<td>'+rs.rows.item(i).bec_fecha.substring(11,16)+'</td>'+
                        '<td>'+rs.rows.item(i).bec_fecha.substring(0,5)+'</td>'+
                    '</tr>';
            }
            if(bec_id==0&&rs.rows.length==rs.rows.item(0).par_becerros){
                display='';
                $('#btn_agregar_becerro').hide();
            }            
            var html=''+
            '<div class="col-xs-12 col-sm-12 col-md-12">'+
                '<table id="activeb" class="table table-condensed">'+
                    '<thead>'+
                        '<tr>'+                             
                            '<th>'+lang.caravana+'</th>'+
                            '<th>'+lang.hora+'</th>'+
                            '<th>'+lang.fecha+'</th>'+
                        '</tr>'+
                    '</thead>'+
                    '<tbody>'+becerros+
                '</table>'+
                '<button onclick="pantalla_2()" type="submit" class="ready btn btn-primary btn-md" style="margin-top:2px;display:'+display+'"><span class="glyphicon glyphicon-ok" ></span> Confirmar</button>'+
            '</div>';
        }        
        $('#tabla_becerros').html(html);
        $('#cargando_app').hide();
    })});
}

function buscar_vaca(id_vaca){
    if(id_vaca!=""){
        $('#cargando_app').show();
        db.transaction(function(tx){tx.executeSql('select * from vacas WHERE vac_id=?', [id_vaca], function(tx, rs) {
          if(rs.rows.length) {
            $('input:radio[name=par_vaca_raza][value='+rs.rows.item(0).vac_raza+']').click();
          }
          $('#cargando_app').hide();
        })});        
    }
}

function validar_formulario(form,campos){
    var vacio=false
    var $inputs = $('#'+form+' :input');
    $inputs.each(function() {
        if(this.type=='radio'&&!document.querySelector('input[name="'+this.name+'"]:checked')) vacio=true;
        if(this.type=='text'&&$(this).val()=='') vacio=true;
    });
    if(vacio) notificacion("Complete todos los datos.","error");
    else return true;
}

function current_date(){
    var today = new Date();
    var month = today.getMonth()+1<10?'0'+today.getMonth()+1:today.getMonth()+1;
    var day = today.getDate()<10?'0'+today.getDate():today.getDate();
    var year = today.getFullYear();
    var cHour = today.getHours()<10?'0'+today.getHours():today.getHours();
    var cMin = today.getMinutes()<10?'0'+today.getMinutes():today.getMinutes();
    var cSec = today.getSeconds()<10?'0'+today.getSeconds():today.getSeconds();
    return day+"/"+month+"/"+year+" "+cHour+ ":" + cMin+ ":" +cSec;    
}

function datediff(fromDate,toDate,interval) { 
    var second=1000, minute=second*60, hour=minute*60, day=hour*24, week=day*7; 
    fromDate = new Date(fromDate); 
    toDate = new Date(toDate); 
    var timediff = toDate - fromDate; 
    if (isNaN(timediff)) return NaN; 
    switch (interval) { 
        case "years": return toDate.getFullYear() - fromDate.getFullYear(); 
        case "months": return ( 
            ( toDate.getFullYear() * 12 + toDate.getMonth() ) 
            - 
            ( fromDate.getFullYear() * 12 + fromDate.getMonth() ) 
        ); 
        case "weeks"  : return Math.floor(timediff / week); 
        case "days"   : return Math.floor(timediff / day);  
        case "hours"  : return Math.floor(timediff / hour);  
        case "minutes": return Math.floor(timediff / minute); 
        case "seconds": return Math.floor(timediff / second); 
        default: return undefined; 
    } 
}

function ultimo_movimiento(sql){
    if(sql!=""){
        db.transaction(function(tx){tx.executeSql("insert into movimientos (mov_sql) VALUES ('"+escape(sql)+"')")});
        db.transaction(function(tx){tx.executeSql("update configuracion set cfg_ult_act_local='"+current_date()+"'")});    
    }
}

function marcar_becerro(bec_id,bec_caravana){
    if($('#reg_becerro_'+bec_id).hasClass('marca_becerro')){
        $('#reg_becerro_'+bec_id).removeClass();
        $('#bec_marcado').val('');
        $('#bec_nro_marcado').val('');
    }
    else{
        $('tr[name*=reg_becerro_]').removeClass();
        $('#reg_becerro_'+bec_id).addClass('marca_becerro');
        $('#bec_marcado').val(bec_id);
        $('#bec_nro_marcado').val(bec_caravana);
    }    
}

function marcar_muerto(){
    if($('#bec_marcado').val()!=""){
        db.transaction(function(tx){tx.executeSql("update becerros set bec_muerto='S', bec_fecha_muerto='"+current_date()+"' where bec_id='"+$('#bec_marcado').val()+"'")});       
        ultimo_movimiento("update becerros set bec_muerto='S', bec_fecha_muerto='"+current_date()+"' where bec_id='"+$('#bec_marcado').val()+"'");
        pantalla_7();
    }
}

function marcar_calostro(){
    if($('#bec_marcado').val()!=""&&$('#bec_nro_marcado').val()!=""){
        pantalla_6($('#bec_marcado').val(),$('#bec_nro_marcado').val());
    }
}

function editar_becerro(){
    if($('#bec_marcado').val()!=""){        
        obtener_becerro($('#bec_marcado').val());
    }
}

function cargar_calostro(bec_id){
    $('#cargando_app').show();
    if(validar_formulario('frm_cargar_calostro','todos')){
        var values = new Array();
        values[0]=bec_id;
        values[1]=$('#cal_calidad').val();
        values[2]=$('#cal_cantidad').val();
        values[3]=$('#cal_vigor').val();
        values[4]=$('#cal_peso').val();
        values[5]=$('#cal_tecnico').val();
        values[6]=current_date();
        db.transaction(function(tx){tx.executeSql("insert into calostro (cal_becerro,cal_calidad,cal_cantidad,cal_vigor,cal_peso,cal_tecnico,cal_fecha) VALUES ('"+values.join("','")+"')",[],function(tx,rs){
            ultimo_movimiento("insert into calostro (cal_becerro,cal_calidad,cal_cantidad,cal_vigor,cal_peso,cal_tecnico,cal_fecha) VALUES ('"+values.join("','")+"')");
            pantalla_7();
        })});
    }
    $('#cargando_app').hide();
}

function obtener_becerro(bec_id){
    db.transaction(function(tx){tx.executeSql('select  * from becerros where bec_id=?', [bec_id], function(tx, rs) {
        if(rs.rows.length){
            becerro=Array();
            becerro[0]=rs.rows.item(0).bec_parto;
            becerro[1]=rs.rows.item(0).bec_sexo;
            becerro[2]=rs.rows.item(0).bec_condicion;
            becerro[3]=rs.rows.item(0).bec_presentacion;
            becerro[4]=rs.rows.item(0).bec_caravana;
            becerro[5]=rs.rows.item(0).bec_tecnico;
            becerro[6]=rs.rows.item(0).bec_id;
            pantalla_5(rs.rows.item(0).bec_parto,becerro);
        }
        else{
            return false;
        }
    })});
}

/* Verifico si necesita actualizar la aplicacion */

function buscar_actualizaciones(){
  if(navigator.onLine){
    db.transaction(function(tx){tx.executeSql('select * from configuracion', [], function(tx, rs) {
      $.post(dir_datos+'datos.php',{accion:'ultima_actualizacion',fecha:rs.rows.item(0).cfg_ult_sinc},function(res){
        if(res!="NO"){
          actualizar();
        }
        else if(datediff(rs.rows.item(0).cfg_ult_sinc,rs.rows.item(0).cfg_ult_act_local,'minutes')>60){
            actualizar();
        }
        else{
          setTimeout(function(){buscar_actualizaciones();},600000);
        }
      });
    })});
  }
}

function actualizar(){
    html=''+
        '<span>'+lang.msg_sincronizar+'<span>'+
        '<button type="button" onclick="actualizar_aceptar()" class="btn btn-success btn-sm">'+lang.sincronizar+'</button>&nbsp;&nbsp;'+
        '<button type="button" onclick="actualizar_cancelar()" class="btn btn-danger btn-sm">'+lang.cancelar+'</button>';
    $('#actualizar').html(html);
    $('#actualizar').css('bottom','-70px');
    $('#actualizar').show();
    $('#actualizar').animate({ bottom: '0' }, 500);    
}

function actualizar_aceptar(){
    location.replace('sinc.html?kk='+Math.random());
}

function actualizar_cancelar(){
    $('#actualizar').animate({ bottom: '-70' }, 500);
}

function soloNumeros(e){
    var key = window.Event ? e.which : e.keyCode
    return (key >= 48 && key <= 57)
}

function cambiar_idioma(idioma){
    if(idioma=='es') lang=lang_es;
    if(idioma=='en') lang=lang_en;    
    verificar_base();
}

buscar_actualizaciones();