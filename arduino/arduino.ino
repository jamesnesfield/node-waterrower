int LEDpin = 13;
unsigned long ping;
int state;
String buffer;
void setup()
{
  Serial.begin(9600);
  ping = millis() + 1000;
  state = HIGH;
  digitalWrite(LEDpin, state);
}
void loop()
{
  /*
  digitalWrite(LEDpin, HIGH);
  delay(1000);
  digitalWrite(LEDpin, LOW);
  delay(1000);
  //Serial.write(45);
  Serial.write("Hello");
  Serial.write("\r\n");
  */
  if (Serial.available() > 0)
  {
    char inchar = Serial.read();
    if (inchar == '\n')
    {
      Serial.print(buffer);
      Serial.write(0X0D0A);
      buffer = "";
    }
    else
    {
      buffer += inchar;
      //Serial.write("char=" + inchar);
    }
  }
  
  if (millis() > ping)
  {
    if (state == HIGH)
    {
      state = LOW;
    }
    else
    {
      state = HIGH;
    }
    digitalWrite(LEDpin, state);
    ping = millis() + 1000;
    Serial.write("PING");
    Serial.write(0X0D0A);
  }
  //Serial.print(switchTime);
  //Serial.print(" now ");
  //Serial.println(millis());
  //delay(200);
  
}
  
