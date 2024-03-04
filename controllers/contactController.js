const validator = require("validator")
const sanitizeHtml = require("sanitize-html")
const nodemailer = require("nodemailer")
const { ObjectId } = require("mongodb")
const petsCollection = require("../db").db().collection("pets")
const contactsCollection = require("../db").db().collection("contacts")



const sanitizeOptions = {
  allowedTags: [],
  allowedAttributes: {}
}


exports.submitContact = async function (req, res, next) {
  if (req.body.secret.toUpperCase() !== "PUPPY") {
    console.log("Spam Detected")
    return res.json({ message: "Sorry!" })
  }

  if (typeof req.body.name != "string") {
    req.body.name = ""
  }
  if (typeof req.body.email != "string") {
    req.body.email = ""
  }
  if (typeof req.body.comment != "string") {
    req.body.comment = ""
  }

  if (!validator.isEmail(req.body.email)) {
    console.log("Invalid Email address detacted")
    return res.json({ message: "Sorry!" })

  }
  if (!ObjectId.isValid(req.body.petId)) {
    console.log("Invalid ID detacted")
    return res.json({ message: "Sorry!" })

  }

  req.body.petId = new ObjectId(req.body.petId)

  const doesPetExist = await petsCollection.findOne({ _id: req.body.petId })
  if (!doesPetExist) {
    console.log("Pet does not exist")
    return res.json({ message: "Sorry!" })

  }

  const ourObject = {
    petId: req.body.petId,
    name: sanitizeHtml(req.body.name, sanitizeOptions),
    email: sanitizeHtml(req.body.email, sanitizeOptions),
    comment: sanitizeHtml(req.body.comment, sanitizeOptions),
    adult: sanitizeHtml(req.body.adult, sanitizeOptions),
    children: sanitizeHtml(req.body.children, sanitizeOptions),
    startDate: sanitizeHtml(req.body.startDate, sanitizeOptions),
    endDate: sanitizeHtml(req.body.endDate, sanitizeOptions)
  }
  console.log(ourObject)

  var transport = nodemailer.createTransport({
    host: "sandbox.smtp.mailtrap.io",
    port: 2525,
    auth: {
      user: process.env.MAILTRAPUSERNAME,
      pass: process.env.MAILTRAPPASSWORD
    }
  })

  try {
    const promise1 = transport.sendMail({
      to: ourObject.email,
      from: "petadoption@localhost",
      subject: `Thank you for your interest in ${doesPetExist.name}`,
      html: `<h3 style="color: green; font-size: 32px; font-weight: normal;">Thank You!</h3>
          <p>We appreciate your interest in <strong> ${doesPetExist.name}</strong> and one of our staff will contact you shortly!<br>Below is a copy of the message you sent us for your personal records:</p>
          <p style="text-align: center;"><em>${ourObject.comment}</em></p>`
    })
    const promise2 = transport.sendMail({
      to: "petadoption@localhost",
      from: "petadoption@localhost",
      subject: `Someone is interested in ${doesPetExist.name}`,
      html: `<h3 style="color: green; font-size: 32px; font-weight: normal;">New Contact!</h3>
    <p>Name: ${ourObject.name}<br>
    Pet interested in: ${doesPetExist.name}<br>
    Email: ${ourObject.email}<br>
    Message: ${ourObject.comment}<br>
    Number of Adults: ${ourObject.adult}<br>
    Number of Children: ${ourObject.children}<br>
    Requested Start Date: ${ourObject.startDate}<br>
    Requested End Date: ${ourObject.endDate}
    </p>`
    })

    const promise3 = await contactsCollection.insertOne(ourObjectS)

    await Promise.all([promise1], [promise2, promise3])
  } catch (err) {
    next(err)
  }


  res.send("Thanks for sending data to us")
}

exports.viewPetContacts = async (req, res) => {
  if (!ObjectId.isValid(req.param.id)) {
    console.log("bad Id")
    return res.redirect("/")
  }

  const pet = await petsCollection.findOne({ _id: new ObjectId(req.params.id) })


  if (!pet) {
    console.log("pet does not exist")
    return res.redirect("/")

  }




  const contacts = await contactsCollection.find({ petId: new ObjectId(req.params.id) }).toArray()
  res.render("pet-contacts", { contacts: [] })
}



