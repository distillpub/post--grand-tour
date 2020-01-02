Letter to Reviewer 2
> There are a few issues with the paper, mostly due to the writing. For example, while the writeup of the math is overall convincing there are typos that confuse, e.g. including more terms in (dx, dy, ...) than are actually there.

Thank you for the comment. We included more terms in the description. 

> I also think that even in the technical explanation part, more care to use citations with linear algebra and neural networks literature would be helpful. Much of the linear algebra is core material, so instead of just citing a textbook, it would be helpful to include a few sentences of explanation rather than stating something as straightforward fact.

Thank you for the comment.
We do agree that some intuitions about linear algebra, specifically  SVD, is helpful. However, we do not know of any short explanation of this topic other than spelling out all the details of linear algebra behind it, or this article (http://www.ams.org/publicoutreach/feature-column/fcarc-svd) which include the geometric interpretations of SVD we used in the article. So instead of explaining linear algebra in our article, we cited the above article.

> …Even more so with neural networks material throughout the paper - the audience for this work could be wide, so stating things about neural network internals without citation or explanation is damaging. One example is the idea that linear methods for projection are most appropriate because of the linear nature of the networks. This is not really straightforward and I'm not convinced but it is left unsupported.

Thank you for the comment.  We rephrased our argument accordingly. Instead of saying ‘neural networks are (mostly) linear’, we changed into ‘Although deep neural networks are clearly not linear processes, they often confine their nonlinearity to a small set of operations, enabling us to still reason about their behavior.’

> …One more example is that a sentence about how network components become vector inputs to this system may widen the audience.

Thank you for the suggestion.  We now emphasize this view by saying “…activations of neurons after a layer, can also be seen as vectors in R^n…”

> Relatedly, the enthusiasm is a bit too high for academic material. Using words like amazing and including an exclamation point are not appropriate.

Thank you for the comment.  We made a full pass of the article and removed such words and exclamation marks.

> Perhaps the most disconcerting was an assertion at the beginning that neural networks are now the default classifier. This is far from true for many reasons. They are slow and expensive to train and require lots of data, plus they are difficult to interpret, making them a poor choice for many machine learning applications. Not only is that assertion inaccurate, it will be galling to many potential readers.

Thank you for the comment.  We removed this assertion and replaced it by “Deep neural networks often achieve best-in-class performance in supervised learning contests…”

> The main confusion is actually about how the user is meant to take advantage of this technique and when. This seems to be about confusion over two separate things. First, the concept of moving axes vs moving selected groups of points. These distinctions are neatly identified in the math, but I do not see how this works with the user perspective. The case has been made for moving axes to get a good view, but when would the points be more appropriate? Would I have to know which ones to look at from some other source? There is some coverage of the different uses, but it needs to be organized better to lay it out from the user perspective.

Thank you for the comment.  We now clarify this point in the beginning of the Grand Tour of layer dynamics, where we explain that direct manipulations on the axes are not satisfying for intermediate layers because (the second bullet:) there are too many dimensions to interact with and these dimensions do not have as clear semantics as the softmax layer.

> The other issue is that the idea about a continuum of projections is lovely in the mathematics, but isn't really practical for understanding how a user would take advantage. In all cases it seems like the someone really needs to know exactly what they're looking for already. I think breaking this down by use cases, again by user tasks, would really clarify what this system can do. Right now, I'm left with an interesting concept, and an implementation I believe in, but no clear vision for how this helps.

Thank you for the comment.  We explain the reason and advantage for a continuum of projections (i.e. the Grand Tour) as part of the main text. In the beginning of “the Grand Tour” section, we propose to use the Grand Tour because “…we don't know ahead of time which projection to choose from, because we don't quite know what to look for…”  Deep down, the Grand Tour allow users distinguish points that a particular linear projection may make them overlapped. It allows users to distinguish and eliminates artifacts of visualizations that any single linear projection has when users want to find low dimensional structures (e.g. triangles, lines) in high dimensional space. In the interest of length, we did not discuss this theoretical power of Grand Tour animation in length.

> “distribution of data from softmax layers is spherical” - without citation? In this case it's just about orthogonality and makes sense, but that strong unclear statement weakens the paragraph.

Thank you for the comment.  We made our argument clearer by saying “…the distribution of data in softmax layers often has similar variance along many axis directions…”

> typos, especially of the misconjugation variety, are very common

Thank you for the comment. We made a full pass of our text and tried our best to eliminate such errors.

> watch GN^{new} vs GT^'. They seem to have been used interchangeably.

Thank you for the comment. We rewrote the technical details section and made the notations consistent.

